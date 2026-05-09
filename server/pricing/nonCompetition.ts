/**
 * Stewardly pricing — Dual-anchor non-competition enforcement
 * =============================================================
 *
 * Per PHASE1_BRIEF.md commitment C-24, the strategic non-competition
 * posture vs foundation-model providers (Anthropic, OpenAI, Manus, etc.)
 * is enforced by TWO independent anchors:
 *
 *   Anchor 1 — Economic (non-scaling-margin)
 *     The three-component pricing structure is structurally incompatible
 *     with foundation-model economics:
 *       (a) ValueShare scales with VALIDATED OUTCOME (MeasuredSavings),
 *           which is decoupled from token volume.
 *       (b) Operational cost-plus scales with INFRASTRUCTURE COST, which
 *           is sub-linear in token volume due to amortization.
 *       (c) Provider DirectCost has ZERO MARKUP (DC-3, load-bearing).
 *     None of (a) (b) (c) creates the scaling-margin economics that
 *     foundation-model competitive investment would require. The platform
 *     CANNOT finance becoming a foundation-model provider from this
 *     revenue model.
 *
 *   Anchor 2 — Compliance (AI non-compete covenant)
 *     The platform contractually commits NOT to use user-brought model
 *     interactions, prompts, outputs, or workflow patterns to train
 *     competing models, derive competitive insights, or otherwise
 *     compete with the foundation-model providers whose capabilities
 *     the platform hosts. This is a hard substrate-router obligation
 *     (see `_intent.ts` line 126: "0% markup, provider-neutral").
 *
 * This module provides invariant checks that can be called from the
 * substrate router and from tests. The checks throw on violation rather
 * than silently passing through, so any future code change that breaks
 * the non-competition invariants fails loud.
 *
 * Invariants (enforced by `__tests__/nonCompetition.test.ts`):
 *   NC-1: assertZeroMarkupOnDirectCost — directCostPassthroughUsd ===
 *         apiUsd on internal-bundled path
 *   NC-2: assertNoOutcomeIndependentMargin — ValueShare floor at 0
 *         (no negative outcome can produce positive Stewardly revenue
 *         from outcome-coupled component)
 *   NC-3: assertOperationalMarkupBounded — operational markup ∈ [0,
 *         MARKUP_CAP], sub-linear in token volume
 *   NC-4: assertNonCompeteCovenantPresent — at substrate-router
 *         construction time, the AI non-compete covenant flag must be
 *         counsel-reviewed-true on the current Stewardship.
 */

import type { IntentCost } from "../engines/_intent";
import type { ConsumptionPath, PricingLineItem } from "./index";
import { passthroughDirectCost } from "./directCost";

export class NonCompetitionViolationError extends Error {
  readonly invariantId: string;

  constructor(invariantId: string, message: string) {
    super(`Non-competition invariant ${invariantId} violated: ${message}`);
    this.name = "NonCompetitionViolationError";
    this.invariantId = invariantId;
  }
}

/**
 * NC-1: zero-markup invariant on provider DirectCost.
 * Asserted at the substrate router and in invariant tests.
 */
export function assertZeroMarkupOnDirectCost(
  cost: IntentCost,
  path: ConsumptionPath,
  passthroughUsd: number,
): void {
  const expected = passthroughDirectCost(cost, path);
  if (passthroughUsd !== expected) {
    throw new NonCompetitionViolationError(
      "NC-1",
      `expected directCostPassthroughUsd=${expected} on path=${path} (apiUsd=${cost.apiUsd}), got ${passthroughUsd}`,
    );
  }
}

/**
 * NC-2: no outcome-independent margin component is allowed to be
 * negative-amplified. Stewardly never invoices negative ValueShare.
 */
export function assertNoOutcomeIndependentMargin(line: PricingLineItem): void {
  if (line.valueShareUsd < 0) {
    throw new NonCompetitionViolationError(
      "NC-2",
      `valueShareUsd=${line.valueShareUsd} is negative; Stewardly never invoices negative ValueShare`,
    );
  }
}

/**
 * NC-3: operational markup must remain bounded; this is what keeps the
 * margin scaling sub-linear in token volume and structurally incompatible
 * with foundation-model competitive investment.
 */
export const MAX_NON_COMPETING_OPERATIONAL_MARKUP = 1.0;

export function assertOperationalMarkupBounded(markup: number): void {
  if (markup < 0 || markup > MAX_NON_COMPETING_OPERATIONAL_MARKUP) {
    throw new NonCompetitionViolationError(
      "NC-3",
      `operationalMarkup=${markup} outside [0, ${MAX_NON_COMPETING_OPERATIONAL_MARKUP}]`,
    );
  }
}

/**
 * NC-4: the AI non-compete covenant must be counsel-reviewed-true on
 * the current Stewardship before any substrate router dispatch. This is
 * the contractual anchor that pairs with the economic anchor.
 *
 * The Stewardship object is defined in `server/engines/_substrate.ts`;
 * we accept a minimal shape here to avoid a hard import-cycle.
 */
export interface CovenantSurface {
  aiNonCompeteCovenantCounselReviewed?: boolean;
}

export function assertNonCompeteCovenantPresent(stewardship: CovenantSurface): void {
  if (!stewardship.aiNonCompeteCovenantCounselReviewed) {
    throw new NonCompetitionViolationError(
      "NC-4",
      "aiNonCompeteCovenantCounselReviewed flag is not set on the current Stewardship; refusing to dispatch",
    );
  }
}

/**
 * Composite check: run all four anchors against a pricing line and
 * stewardship. Used by the substrate router as the final gate before
 * dispatch.
 */
export function assertNonCompetitionPosture(
  line: PricingLineItem,
  cost: IntentCost,
  path: ConsumptionPath,
  operationalMarkup: number,
  stewardship: CovenantSurface,
): void {
  assertZeroMarkupOnDirectCost(cost, path, line.directCostPassthroughUsd);
  assertNoOutcomeIndependentMargin(line);
  assertOperationalMarkupBounded(operationalMarkup);
  assertNonCompeteCovenantPresent(stewardship);
}
