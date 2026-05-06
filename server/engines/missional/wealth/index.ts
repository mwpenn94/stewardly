/**
 * Wealth mission specialization (within Missional)
 * ================================================
 *
 * Ports the stewardly-ai wealth-engine functionality. The full set of
 * intent kinds is defined here; the implementation files in this
 * directory carry the financial modeling, planning calculations, advisor
 * recommendations, household graph, and CE tracking adapted for the
 * advisor mission.
 *
 * Intent kinds:
 *   - missional.wealth.calculate         — run a calculator (retirement,
 *                                          tax, business, etc.)
 *   - missional.wealth.plan              — produce a plan proposal
 *   - missional.wealth.recommend         — advisor recommendation
 *   - missional.wealth.household.graph   — household graph operations
 *   - missional.wealth.ce.track          — CE tracking (compliance class —
 *                                          v3 §3 §7 means automatic is forbidden)
 *   - missional.wealth.snaptrade.sync    — read positions via SnapTrade
 *   - missional.wealth.plaid.sync        — read accounts via Plaid
 *
 * The actual ported implementation is wired in `./calculators.ts`,
 * `./planning.ts`, `./advisor.ts`, `./household.ts`, `./ce.ts` and the
 * SnapTrade / Plaid integration adapters under `./integrations/`.
 */

import type { EngineHandler, IntentResult } from "../../_intent";
import { emptyCost, assertComplianceAdminAllowed } from "../../_intent";
import { runWealthCalculator } from "./calculators";
import { generateWealthPlan } from "./planning";
import { generateAdvisorRecommendation } from "./advisor";
import { householdGraphOp } from "./household";
import { trackCe } from "./ce";

export const wealthMissionHandler: EngineHandler = async (ctx, intent): Promise<IntentResult> => {
  ctx.log("info", "missional.wealth.received", { kind: intent.kind });

  // CE tracking is compliance class.
  if (intent.kind === "missional.wealth.ce.track") {
    assertComplianceAdminAllowed({ ...ctx.meta, originEngine: "missional", isComplianceClass: true });
  }

  switch (intent.kind) {
    case "missional.wealth.calculate":
      return runWealthCalculator(ctx, intent);
    case "missional.wealth.plan":
      return generateWealthPlan(ctx, intent);
    case "missional.wealth.recommend":
      return generateAdvisorRecommendation(ctx, intent);
    case "missional.wealth.household.graph":
      return householdGraphOp(ctx, intent);
    case "missional.wealth.ce.track":
      return trackCe(ctx, intent);
    case "missional.wealth.snaptrade.sync":
    case "missional.wealth.plaid.sync":
      return ctx.substrate.dispatch(intent);
    default:
      return {
        ok: false,
        error: { code: "UNKNOWN_INTENT", message: `Wealth mission does not handle "${intent.kind}"` },
        invoked: [],
        cost: emptyCost(),
        auditId: ctx.meta.correlationId,
      };
  }
};
