/**
 * Continuous Improvement engine
 * =============================
 *
 * The platform's self-extending intelligence and efficiency capabilities.
 * Name retained from stewardly-ai (the only engine that did not get
 * renamed in v3 because the name was already correct).
 *
 * Responsibilities:
 *   - run recursive Pass cycles (the "Pass 162", "Pass 163" lineage)
 *   - propose substrate-cost optimizations to the practitioner
 *     at the configured admin level
 *   - coordinate with the BYOM single-button-press setup agent
 *
 * Intent kinds (initial):
 *   - continuous-improvement.pass.run
 *   - continuous-improvement.pass.report
 *   - continuous-improvement.byom.setup
 *   - continuous-improvement.byom.estimate
 */

import type { EngineHandler, IntentResult } from "../_intent";
import { emptyCost } from "../_intent";

export const continuousImprovementHandler: EngineHandler = async (ctx, intent): Promise<IntentResult> => {
  ctx.log("info", "continuous-improvement.received", { kind: intent.kind });

  switch (intent.kind) {
    case "continuous-improvement.pass.run":
    case "continuous-improvement.pass.report":
    case "continuous-improvement.byom.setup":
    case "continuous-improvement.byom.estimate":
      return ctx.substrate.dispatch(intent);
    default:
      return {
        ok: false,
        error: { code: "UNKNOWN_INTENT", message: `Continuous Improvement does not handle "${intent.kind}"` },
        invoked: [],
        cost: emptyCost(),
        auditId: ctx.meta.correlationId,
      };
  }
};
