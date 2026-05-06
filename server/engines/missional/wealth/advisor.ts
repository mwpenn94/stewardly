/**
 * Wealth advisor recommendation — Intent handler for missional.wealth.recommend
 *
 * Advisor recommendations are compliance class. v3 §3 forbids the
 * automatic admin level for compliance-class intents; the substrate
 * router enforces that, and we re-assert it here to fail fast at the
 * engine boundary.
 */

import type { EngineContext, Intent, IntentResult } from "../../_intent";
import { emptyCost, assertComplianceAdminAllowed } from "../../_intent";

export interface AdvisorRecommendationInput {
  clientId: string;
  /** A reference to a previously generated wealth plan (proposalId). */
  planProposalId?: string;
  /** The recommendation kind (e.g. "rollover", "rebalance", "policy_replacement"). */
  kind: string;
  /** Free-form rationale; the substrate generates the costed proposal. */
  rationale?: string;
}

export async function generateAdvisorRecommendation(
  ctx: EngineContext,
  intent: Intent<unknown>,
): Promise<IntentResult> {
  // Compliance class — re-assert.
  assertComplianceAdminAllowed({ ...ctx.meta, originEngine: "missional", isComplianceClass: true });

  const input = intent.payload as Partial<AdvisorRecommendationInput>;
  if (!input?.clientId || !input.kind) {
    return {
      ok: false,
      error: { code: "BAD_PAYLOAD", message: "missional.wealth.recommend requires { clientId, kind, rationale?, planProposalId? }" },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }

  // Counsel-review check: the engine refuses to issue any compliance-bearing
  // claim unless the corresponding stewardship counsel-review flag is set.
  if (!ctx.stewardship.counselReviewed.guaranteeLanguage) {
    return {
      ok: false,
      error: { code: "COUNSEL_REVIEW_REQUIRED", message: "Compliance-bearing language requires counsel review (v3 §3, stewardship)." },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }

  const proposal = await ctx.substrate.dispatch({
    kind: "missional.wealth.recommend.proposal",
    expects: ["proposal-generator", "agentic-runtime"],
    payload: { clientId: input.clientId, kind: input.kind, rationale: input.rationale ?? "" },
    meta: { ...ctx.meta, originEngine: "missional", isComplianceClass: true },
  });

  return {
    ok: proposal.ok,
    data: proposal.data as never,
    invoked: [...proposal.invoked, "proposal-generator"],
    cost: proposal.cost,
    qualityScore: proposal.qualityScore ?? 0.9,
    auditId: ctx.meta.correlationId,
  };
}
