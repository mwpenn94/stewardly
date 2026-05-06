/**
 * Stewardly substrate primitives — STEWARDLY v3 §3
 * =================================================
 *
 * Eight primitives the engines compose. Substrate has zero engine-specific
 * code; engines compose primitives via the Intent contract in `./_intent.ts`.
 *
 * Each primitive is defined here as an interface only; concrete bindings
 * (Forge LLM, Whisper, S3 vault, RAG over the Contextual engine, etc.) are
 * adapted in `./_substrateAdapters.ts` from the Manus Next foundation.
 */

import type { AdminLevel, IntentCost } from "./_intent";

/* ------------------------------------------------------------------ *
 * 1. chat-surface                                                     *
 * ------------------------------------------------------------------ */

export interface ChatSurface {
  /**
   * Stream a chat turn. Bound to the foundation's SSE agentStream pipeline.
   */
  streamTurn(opts: {
    tenantId: string;
    practitionerId: string;
    threadId: string;
    message: string;
    onToken: (token: string) => void;
    onDone: (text: string, cost: IntentCost) => void;
    onError: (err: Error) => void;
  }): Promise<void>;
}

/* ------------------------------------------------------------------ *
 * 2. agentic-runtime                                                  *
 * ------------------------------------------------------------------ */

export interface AgenticRuntime {
  /**
   * Run an agentic plan-and-execute loop with up to N turns. Bound to the
   * foundation's executeReActLoop pattern. The classifier gates each turn
   * for cost.
   */
  runPlan(opts: {
    tenantId: string;
    plan: { goal: string; budgetUsd: number; maxTurns: number };
    tools: string[];
  }): Promise<{ summary: string; cost: IntentCost }>;
}

/* ------------------------------------------------------------------ *
 * 3. rag                                                              *
 * ------------------------------------------------------------------ */

export interface Rag {
  /** Retrieve top-k passages for a tenant from the Contextual engine. */
  retrieve(opts: {
    tenantId: string;
    query: string;
    k: number;
    filters?: Record<string, string | number | boolean>;
  }): Promise<Array<{ id: string; text: string; score: number }>>;
}

/* ------------------------------------------------------------------ *
 * 4. embeddings                                                       *
 * ------------------------------------------------------------------ */

export interface Embeddings {
  embed(texts: string[]): Promise<number[][]>;
}

/* ------------------------------------------------------------------ *
 * 5. voice                                                            *
 * ------------------------------------------------------------------ */

export interface Voice {
  /** Speech-to-text. Bound to the foundation's Whisper integration. */
  stt(audio: Uint8Array | string): Promise<{ text: string; cost: IntentCost }>;
  /** Text-to-speech. Bound to Edge TTS / Kokoro. */
  tts(text: string, opts?: { voiceId?: string }): Promise<{ audio: Uint8Array; cost: IntentCost }>;
}

/* ------------------------------------------------------------------ *
 * 6. document-intelligence                                            *
 * ------------------------------------------------------------------ */

export interface DocumentIntelligence {
  parse(opts: { tenantId: string; documentUrl: string }): Promise<{
    text: string;
    chunks: Array<{ id: string; text: string; pageNumber?: number }>;
    cost: IntentCost;
  }>;
  generate(opts: {
    tenantId: string;
    kind: "markdown" | "pdf" | "docx" | "pptx";
    payload: Record<string, unknown>;
  }): Promise<{ url: string; cost: IntentCost }>;
}

/* ------------------------------------------------------------------ *
 * 7. classifier (always LOCAL, gates everything)                       *
 * ------------------------------------------------------------------ */

export interface Classifier {
  /**
   * Local classification. Returns a sub-cent cost estimate before any
   * provider-side LLM call is made. Implementations MUST NOT make any
   * remote network call.
   */
  classify(opts: {
    text: string;
    candidateLabels?: string[];
  }): Promise<{ label: string; confidence: number; estimatedRoute: { primitive: string; estimateUsd: number } }>;
}

/* ------------------------------------------------------------------ *
 * 8. proposal-generator                                               *
 * ------------------------------------------------------------------ */

export interface ProposalGenerator {
  /**
   * Generate a costed proposal for the practitioner to review at the
   * configured admin level. The proposal is what makes "supervised" and
   * "delegated" possible without crossing into "automatic".
   */
  generate(opts: {
    tenantId: string;
    practitionerId: string;
    adminLevel: AdminLevel;
    intentKind: string;
    rationale: string;
    estimatedCost: IntentCost;
  }): Promise<{ proposalId: string }>;
}

/* ------------------------------------------------------------------ *
 * Stewardship (tenant policy / brand language / counsel-reviewed flags) *
 * ------------------------------------------------------------------ */

export interface Stewardship {
  /** Brand language (counsel-reviewed; never imply fiduciary obligations). */
  brandLanguage: {
    practitionerNoun: string;          // e.g. "advisor", "pastor", "coach"
    practitionerNounPlural: string;
    missionLabel: string;              // e.g. "Wealth", "Pastoral"
  };
  /** Counsel-review status of compliance-bearing claims. */
  counselReviewed: {
    substrateDataFlows: boolean;
    continuousImprovementDataFlows: boolean;
    memoryDataFlows: boolean;
    costMeasurementSpectrumDataFlows: boolean;
    aggregateAssumptionMethodology: boolean;
    guaranteeLanguage: boolean;
    byomTermsStacking: boolean;
    stewardshipFraming: boolean;
  };
  /** Pricing parameters from the unified formula. */
  pricing: {
    platformFeeUsd: number;
    directCostMarkupPct: 0; // INVARIANT: must be 0 (v3 §3)
    infrastructureMarginUsd: number;
    customerSavingsSharePct: number;
  };
  /** EMBA Section 7 ToS guard (always on; never set to off). */
  embaGuard: { enabled: true };
}

/* ------------------------------------------------------------------ *
 * The substrate aggregate                                             *
 * ------------------------------------------------------------------ */

export interface Substrate {
  chatSurface: ChatSurface;
  agenticRuntime: AgenticRuntime;
  rag: Rag;
  embeddings: Embeddings;
  voice: Voice;
  documentIntelligence: DocumentIntelligence;
  classifier: Classifier;
  proposalGenerator: ProposalGenerator;
}
