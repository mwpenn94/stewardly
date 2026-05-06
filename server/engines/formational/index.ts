/**
 * Formational engine
 * ==================
 *
 * The engine of practitioner formation: knowledge cultivation, education,
 * professional development, growth in the practitioner's domain. (Was
 * "Learning" in stewardly-ai.)
 *
 * Intent kinds (initial):
 *   - formational.curate           — curate study material from a topic
 *   - formational.assess           — knowledge-check / SRS card review
 *   - formational.plan-curriculum  — generate a curriculum proposal
 *   - formational.import-emba      — import EMBA-derived material
 *                                     (subject to v3 §3 §7 EMBA Section 7
 *                                     ToS guard — automated access to
 *                                     onlinelearning.quantic.edu is refused
 *                                     by the substrate router; only
 *                                     manually-uploaded artifacts proceed)
 */

import type { EngineHandler, IntentResult } from "../_intent";
import { emptyCost } from "../_intent";

export const formationalHandler: EngineHandler = async (ctx, intent): Promise<IntentResult> => {
  ctx.log("info", "formational.received", { kind: intent.kind, correlationId: ctx.meta.correlationId });

  switch (intent.kind) {
    case "formational.curate":
    case "formational.assess":
    case "formational.plan-curriculum":
    case "formational.import-emba": {
      // Delegate the heavy lifting to the substrate (RAG + agentic-runtime).
      const result = await ctx.substrate.dispatch(intent);
      return { ...result, invoked: [...result.invoked, "rag", "agentic-runtime"] };
    }
    default:
      return {
        ok: false,
        error: { code: "UNKNOWN_INTENT", message: `Formational does not handle "${intent.kind}"` },
        invoked: [],
        cost: emptyCost(),
        auditId: ctx.meta.correlationId,
      };
  }
};
