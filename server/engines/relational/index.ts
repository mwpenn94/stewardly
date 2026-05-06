/**
 * Relational engine
 * =================
 *
 * The engine of relationships and gathered community: relationships,
 * communications, household and team structure, the people the
 * practitioner serves alongside. (Was "People" in stewardly-ai.)
 *
 * Intent kinds (initial):
 *   - relational.household.upsert      — create/update household graph node
 *   - relational.team.upsert           — create/update team-member node
 *   - relational.communication.send    — send a comms-class message
 *                                          (compliance class — never
 *                                          automatic per v3 §3)
 *   - relational.cadence.review        — recommend cadence updates
 */

import type { EngineHandler, IntentResult } from "../_intent";
import { emptyCost, assertComplianceAdminAllowed } from "../_intent";

export const relationalHandler: EngineHandler = async (ctx, intent): Promise<IntentResult> => {
  ctx.log("info", "relational.received", { kind: intent.kind });

  // relational.communication.send is a compliance-class intent.
  if (intent.kind === "relational.communication.send") {
    assertComplianceAdminAllowed({ ...ctx.meta, originEngine: "relational", isComplianceClass: true });
  }

  switch (intent.kind) {
    case "relational.household.upsert":
    case "relational.team.upsert":
    case "relational.communication.send":
    case "relational.cadence.review":
      return ctx.substrate.dispatch(intent);
    default:
      return {
        ok: false,
        error: { code: "UNKNOWN_INTENT", message: `Relational does not handle "${intent.kind}"` },
        invoked: [],
        cost: emptyCost(),
        auditId: ctx.meta.correlationId,
      };
  }
};
