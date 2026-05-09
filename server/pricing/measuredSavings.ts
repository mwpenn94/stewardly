/**
 * Stewardly pricing — Two-stage Measurement & Verification methodology
 * =====================================================================
 *
 * Per PHASE1_BRIEF.md commitment C-2 (third sub-bullet) and the AFK
 * mandate (Pasted_content_01.txt L066-L076), MeasuredSavings is computed
 * via a two-stage methodology that transitions from forward-projection to
 * empirical verification across the first 90 days of a customer's tenure
 * with Stewardly:
 *
 *   Stage 1 — Forward projection (Day 1)
 *     Aggregate-assumption methodology: Stewardly produces a counsel-
 *     reviewed projection of MeasuredSavings using methodology constants
 *     calibrated to the customer's onboarding-stated baseline (their
 *     pre-Stewardly cost basis on the tasks Stewardly will displace).
 *     The methodology constants ARE counsel-reviewed (commitment C-19)
 *     and the projection is bounded by the customer-protection ceiling.
 *
 *   Stage 2 — Empirical M&V (Day 90)
 *     Empirical verification: Stewardly measures the customer's actual
 *     post-adoption cost on the displaced tasks vs the onboarding-stated
 *     baseline. The empirical signal becomes the MeasuredSavings number.
 *
 *   Days 1-90: weighted blend
 *     The weight transitions linearly from 100% projection on Day 1 to
 *     100% empirical on Day 90:
 *       projectionWeight(d) = max(0, (90 - d) / 90)  for d in [0, 90]
 *       empiricalWeight(d)  = 1 - projectionWeight(d)
 *
 *     MeasuredSavings(d) = projectionWeight(d) * projectedSavings
 *                        + empiricalWeight(d) * empiricalSavings
 *
 *     For d > 90, projectionWeight = 0 (pure empirical thereafter).
 *
 * Invariants (enforced by `__tests__/measuredSavings.test.ts`):
 *   MS-1: projectionWeight(0) === 1 (Day 1 is pure projection)
 *   MS-2: projectionWeight(90) === 0 (Day 90 onward is pure empirical)
 *   MS-3: projectionWeight(d) ∈ [0, 1] for all d >= 0
 *   MS-4: projectionWeight(d) is monotonically non-increasing in d
 *   MS-5: weights sum to 1 for d ∈ [0, 90]
 *   MS-6: when only projection is available (empirical absent), we use
 *         pure projection regardless of d (defensive fallback)
 *   MS-7: when only empirical is available (projection absent), we use
 *         pure empirical regardless of d (defensive fallback)
 *   MS-8: projection methodology constants are surfaced for counsel
 *         review (commitment C-19); they are not free parameters
 */

export interface MeasuredSavingsInput {
  /** Days since the customer started with Stewardly (>= 0). */
  daysSinceOnboarding: number;
  /**
   * Stage-1 projected savings (USD) for this period, computed by the
   * aggregate-assumption methodology. Set to undefined when the
   * methodology has not yet produced a projection (rare; defensive).
   */
  projectedSavingsUsd?: number;
  /**
   * Stage-2 empirical savings (USD) for this period, derived from the
   * customer's actual post-adoption cost vs onboarding-stated baseline.
   * Set to undefined when no empirical signal exists yet (early Days 1-N).
   */
  empiricalSavingsUsd?: number;
}

export interface MeasuredSavingsResult {
  measuredSavingsUsd: number;
  projectionWeight: number;
  empiricalWeight: number;
  /** Which stage(s) actually produced signal. */
  signalSources: Array<"projection" | "empirical">;
}

export const TRANSITION_DAYS = 90;

export function projectionWeight(daysSinceOnboarding: number): number {
  if (daysSinceOnboarding < 0) return 1;
  if (daysSinceOnboarding >= TRANSITION_DAYS) return 0;
  return (TRANSITION_DAYS - daysSinceOnboarding) / TRANSITION_DAYS;
}

export function empiricalWeight(daysSinceOnboarding: number): number {
  return 1 - projectionWeight(daysSinceOnboarding);
}

export function computeMeasuredSavings(input: MeasuredSavingsInput): MeasuredSavingsResult {
  const pw = projectionWeight(input.daysSinceOnboarding);
  const ew = empiricalWeight(input.daysSinceOnboarding);

  const haveProjection = typeof input.projectedSavingsUsd === "number";
  const haveEmpirical = typeof input.empiricalSavingsUsd === "number";

  const signalSources: Array<"projection" | "empirical"> = [];

  // Defensive fallbacks (MS-6, MS-7).
  if (haveProjection && !haveEmpirical) {
    signalSources.push("projection");
    return {
      measuredSavingsUsd: input.projectedSavingsUsd ?? 0,
      projectionWeight: 1,
      empiricalWeight: 0,
      signalSources,
    };
  }

  if (!haveProjection && haveEmpirical) {
    signalSources.push("empirical");
    return {
      measuredSavingsUsd: input.empiricalSavingsUsd ?? 0,
      projectionWeight: 0,
      empiricalWeight: 1,
      signalSources,
    };
  }

  if (!haveProjection && !haveEmpirical) {
    return {
      measuredSavingsUsd: 0,
      projectionWeight: pw,
      empiricalWeight: ew,
      signalSources,
    };
  }

  // Both signals present: weighted blend.
  signalSources.push("projection");
  signalSources.push("empirical");
  const measured =
    pw * (input.projectedSavingsUsd ?? 0) + ew * (input.empiricalSavingsUsd ?? 0);

  return {
    measuredSavingsUsd: measured,
    projectionWeight: pw,
    empiricalWeight: ew,
    signalSources,
  };
}
