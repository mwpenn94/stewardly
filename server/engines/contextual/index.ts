/**
 * Contextual engine
 * =================
 *
 * The engine of institutional context: memory, audit trail, search,
 * document vault. (Was "Data" in stewardly-ai.)
 *
 * The Contextual engine is the home of:
 *   - cross-session memory (foundation feature, retained)
 *   - audit-trail rows written by the SubstrateRouter
 *   - tenant-scoped search index used by RAG
 *   - encrypted document vault (per-tenant key, customer-held in S3)
 *
 * Memory portability is first-class and never paywalled (v3 §3).
 *
 * Intent kinds (initial):
 *   - contextual.memory.write
 *   - contextual.memory.read
 *   - contextual.memory.export      — practitioner exports their memory
 *   - contextual.audit.read
 *   - contextual.search.query
 *   - contextual.vault.upload
 *   - contextual.vault.download
 */

import type { EngineHandler, IntentResult } from "../_intent";
import { emptyCost } from "../_intent";

export const contextualHandler: EngineHandler = async (ctx, intent): Promise<IntentResult> => {
  ctx.log("info", "contextual.received", { kind: intent.kind });

  switch (intent.kind) {
    case "contextual.memory.write":
    case "contextual.memory.read":
    case "contextual.memory.export":
    case "contextual.audit.read":
    case "contextual.search.query":
    case "contextual.vault.upload":
    case "contextual.vault.download":
      return ctx.substrate.dispatch(intent);
    default:
      return {
        ok: false,
        error: { code: "UNKNOWN_INTENT", message: `Contextual does not handle "${intent.kind}"` },
        invoked: [],
        cost: emptyCost(),
        auditId: ctx.meta.correlationId,
      };
  }
};
