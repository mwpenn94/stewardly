/**
 * community mission specialization (within Missional) — scaffold
 *
 * STEWARDLY v3 §3 promotes the prior wealth-only engine to a generic
 * Missional engine with siblings for each practitioner-stewardship
 * discipline. This is the scaffold for the community mission; it accepts
 * intents on the same Intent contract and currently routes them
 * through the substrate's classifier-and-acknowledge default.
 *
 * To carry the community mission to parity with wealth, add domain-specific
 * calculators (./calculators.ts), planners (./planning.ts), counsel
 * surfaces (./advisor.ts equivalent), and integration adapters as
 * needed under ./integrations/.
 */

import type { EngineHandler, IntentResult } from "../../_intent";
import { emptyCost } from "../../_intent";

export const communityMissionHandler: EngineHandler = async (ctx, intent): Promise<IntentResult> => {
  ctx.log("info", "missional.community.received", { kind: intent.kind });

  if (!intent.kind.startsWith("missional.community.")) {
    return {
      ok: false,
      error: { code: "UNKNOWN_INTENT", message: `community mission does not handle "${intent.kind}"` },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }

  // Default: classifier-acknowledge through the substrate router.
  // Replace with mission-specific dispatch as the specialization is built.
  return ctx.substrate.dispatch(intent);
};
