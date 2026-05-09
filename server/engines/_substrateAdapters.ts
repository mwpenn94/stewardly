/**
 * Stewardly substrate adapters
 * ============================
 *
 * Concrete bindings that map the eight substrate primitives onto the Manus
 * Next foundation services. The adapters are thin: they delegate to the
 * foundation's existing implementations (LLM streaming, voice, S3, etc.)
 * without changing them. If the foundation evolves, the adapters update;
 * the engines do not.
 */

import { randomUUID } from "node:crypto";
import {
  type Intent,
  type IntentResult,
  type SubstrateRouter,
  type IntentCost,
  emptyCost,
  totalCostUsd,
  assertComplianceAdminAllowed,
} from "./_intent";
import { quanticGuard } from "./quanticBoundary";
import { routedInvoke } from "./_llmRouting";
import type {
  Substrate,
  Stewardship,
  ChatSurface,
  AgenticRuntime,
  Rag,
  Embeddings,
  Voice,
  DocumentIntelligence,
  Classifier,
  ProposalGenerator,
} from "./_substrate";

/* ------------------------------------------------------------------ *
 * Default Stewardship                                                 *
 * ------------------------------------------------------------------ */

export const defaultStewardship: Stewardship = {
  brandLanguage: {
    practitionerNoun: "practitioner",
    practitionerNounPlural: "practitioners",
    missionLabel: "Mission",
  },
  counselReviewed: {
    substrateDataFlows: true,
    continuousImprovementDataFlows: true,
    memoryDataFlows: true,
    costMeasurementSpectrumDataFlows: true,
    aggregateAssumptionMethodology: true,
    guaranteeLanguage: true,
    byomTermsStacking: true,
    stewardshipFraming: true,
  },
  pricing: {
    platformFeeUsd: 0,
    directCostMarkupPct: 0,
    infrastructureMarginUsd: 0,
    customerSavingsSharePct: 0,
  },
  embaGuard: { enabled: true },
};

/* ------------------------------------------------------------------ *
 * Local classifier (simple heuristic baseline; replace with onnx model) *
 * ------------------------------------------------------------------ */

export const localClassifier: Classifier = {
  async classify({ text, candidateLabels }) {
    const labels = candidateLabels && candidateLabels.length > 0 ? candidateLabels : ["chat", "search", "compute", "voice", "document"];
    // Baseline keyword scorer; runs in <1ms; no network call.
    const norm = text.toLowerCase();
    let best = labels[0];
    let bestScore = 0;
    for (const label of labels) {
      const tokens = label.toLowerCase().split(/\W+/).filter(Boolean);
      let score = 0;
      for (const t of tokens) if (norm.includes(t)) score += 1;
      if (score > bestScore) {
        best = label;
        bestScore = score;
      }
    }
    return {
      label: best,
      confidence: Math.min(1, 0.5 + 0.1 * bestScore),
      estimatedRoute: { primitive: best === "chat" ? "chat-surface" : best === "search" ? "rag" : "agentic-runtime", estimateUsd: 0.0001 },
    };
  },
};

/* ------------------------------------------------------------------ *
 * Stub adapters for the rest                                          *
 * Replace each with a foundation-bound implementation as engine usage *
 * is wired in (see Phase 4 "clearly appropriate" decisions).          *
 * ------------------------------------------------------------------ */

const liveChatSurface: ChatSurface = {
  async streamTurn({ message, onToken, onDone, onError, tenantId, threadId }) {
    try {
      const resp = await routedInvoke({
        tenantId: tenantId ?? "anonymous",
        intentKind: `chat.dispatch:${threadId ?? "adhoc"}`,
        messages: [{ role: "user", content: message }],
      });
      // Token-by-token feel for clients without an SSE source.
      onToken(resp.text);
      onDone(resp.text, { ...emptyCost(), apiUsd: resp.costUsd });
    } catch (e) {
      onError(e as Error);
    }
  },
};

const stubAgenticRuntime: AgenticRuntime = {
  async runPlan({ plan }) {
    return { summary: `Plan accepted: ${plan.goal}`, cost: emptyCost() };
  },
};

const stubRag: Rag = {
  async retrieve() {
    return [];
  },
};

const stubEmbeddings: Embeddings = {
  async embed(texts) {
    // Identity stub: a deterministic 8-dim hash per text. Replace with foundation's embeddings.
    return texts.map((t) => {
      const v = new Array(8).fill(0);
      for (let i = 0; i < t.length; i++) v[i % 8] = (v[i % 8] + t.charCodeAt(i)) % 1024;
      return v.map((x) => x / 1024);
    });
  },
};

const stubVoice: Voice = {
  async stt() {
    return { text: "", cost: emptyCost() };
  },
  async tts() {
    return { audio: new Uint8Array(), cost: emptyCost() };
  },
};

const stubDocumentIntelligence: DocumentIntelligence = {
  async parse({ documentUrl }) {
    return { text: "", chunks: [{ id: documentUrl, text: "" }], cost: emptyCost() };
  },
  async generate() {
    return { url: "", cost: emptyCost() };
  },
};

const stubProposalGenerator: ProposalGenerator = {
  async generate() {
    return { proposalId: randomUUID() };
  },
};

export const defaultSubstrate: Substrate = {
  chatSurface: liveChatSurface,
  agenticRuntime: stubAgenticRuntime,
  rag: stubRag,
  embeddings: stubEmbeddings,
  voice: stubVoice,
  documentIntelligence: stubDocumentIntelligence,
  classifier: localClassifier,
  proposalGenerator: stubProposalGenerator,
};

/* ------------------------------------------------------------------ *
 * SubstrateRouter — the gateway                                       *
 * ------------------------------------------------------------------ */

export interface SubstrateRouterOpts {
  substrate?: Substrate;
  /** Audit sink. Defaults to a no-op; in production wire to the Contextual engine. */
  audit?: (row: { auditId: string; intentKind: string; tenantId: string; ok: boolean; cost: IntentCost }) => Promise<void> | void;
}

export function makeSubstrateRouter(opts: SubstrateRouterOpts = {}): SubstrateRouter {
  const substrate = opts.substrate ?? defaultSubstrate;
  const audit = opts.audit ?? (() => undefined);

  return {
    async dispatch<TPayload, TData = unknown>(intent: Intent<TPayload>): Promise<IntentResult<TData>> {
      // 1) Compliance + EMBA guards (v3 §3, §7).
      assertComplianceAdminAllowed(intent.meta);
      // EMBA Section 7 (v3 §7.1): any intent that touches the protected
      // surface is refused unconditionally. Delegated to the dedicated
      // boundary module; see server/engines/quanticBoundary.ts.
      const refusal = quanticGuard(intent);
      if (refusal) {
        await audit({
          auditId: refusal.auditId,
          intentKind: intent.kind,
          tenantId: intent.meta.tenantId,
          ok: false,
          cost: refusal.cost,
        });
        return refusal as unknown as IntentResult<TData>;
      }
      const stringified = JSON.stringify(intent.payload ?? "").toLowerCase();

      // 2) Local classification before any provider call (v3 §3, classifier-gated).
      const cls = await substrate.classifier.classify({ text: intent.kind + " " + stringified.slice(0, 200) });

      // 3) Naive router: this default implementation just acknowledges the
      //    classification and returns. Real engines will register concrete
      //    handlers for their intent kinds; the router will look them up.
      const auditId = randomUUID();
      const cost: IntentCost = {
        ...emptyCost(),
        apiUsd: cls.estimatedRoute.estimateUsd,
      };
      await audit({ auditId, intentKind: intent.kind, tenantId: intent.meta.tenantId, ok: true, cost });

      return {
        ok: true,
        data: { classifiedAs: cls.label, confidence: cls.confidence } as unknown as TData,
        invoked: [cls.estimatedRoute.primitive as never],
        cost,
        qualityScore: cls.confidence,
        auditId,
      };
    },

    async estimate<TPayload>(intent: Intent<TPayload>): Promise<IntentCost> {
      const cls = await substrate.classifier.classify({ text: intent.kind });
      return { ...emptyCost(), apiUsd: cls.estimatedRoute.estimateUsd };
    },
  };
}

export function classifierMinUsd(c: IntentCost): number {
  return totalCostUsd(c);
}
