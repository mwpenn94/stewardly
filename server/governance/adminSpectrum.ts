/**
 * Wave C-2 — Administrative spectrum runtime
 * ============================================
 *
 * Commitment C-15: the administrative spectrum is the spectrum of how
 * much autonomous decision-making each Stewardly engine surface is
 * permitted to perform on behalf of the user. From most-restricted to
 * most-autonomous:
 *
 *   Manual           — every action requires explicit user click
 *   Recommended      — engine surfaces a recommendation; user accepts
 *   Semi-Automatic   — engine acts on routine matters; surfaces edge cases
 *   Supervised-Auto  — engine acts; user reviews after the fact
 *   Automatic        — engine acts; no review required (HARD-CODED EXCLUSION
 *                      for compliance-class workloads, see below)
 *
 * Promotion gates: a surface can only be promoted from one rung to the
 * next when ALL FIVE criteria pass:
 *
 *   PG-1  Reliability      — measured success rate ≥ 95% on the prior rung
 *                            for the configured evaluation window
 *   PG-2  Coverage         — ≥ 50 observations under the prior rung
 *   PG-3  No-incidents     — zero incidents requiring rollback in the window
 *   PG-4  Counsel-cleared  — counsel review flag is `cleared`
 *                            (compliance-class always blocks promotion to
 *                            "Automatic" regardless of this flag, per
 *                            PHASE1_BRIEF.md §C-15)
 *   PG-5  Tenant opt-in    — tenant has explicitly opted in to the
 *                            target rung
 *
 * Demotion automation: an incident or sustained reliability dip drops
 * the surface back one rung automatically. A tenant can opt-out of
 * automatic demotion only with a counsel-cleared flag.
 *
 * This module is pure (no DB) and exposes the state machine for use by
 * tRPC procedures and tests.
 */

export type AdminRung =
  | "Manual"
  | "Recommended"
  | "SemiAutomatic"
  | "SupervisedAuto"
  | "Automatic";

export const RUNG_ORDER: readonly AdminRung[] = [
  "Manual",
  "Recommended",
  "SemiAutomatic",
  "SupervisedAuto",
  "Automatic",
];

export interface PromotionInputs {
  current: AdminRung;
  target: AdminRung;
  /** Surface workload classification — "compliance" blocks Automatic. */
  workloadClass: "general" | "compliance";
  /** Successful observations on current rung. */
  successCount: number;
  /** Total observations on current rung. */
  totalObservations: number;
  /** Number of incidents requiring rollback in the window. */
  incidentCount: number;
  /** Counsel-review status for the surface promotion. */
  counselReviewStatus: "pending" | "cleared" | "blocked";
  /** Tenant has explicitly opted in to the target rung. */
  tenantOptedIn: boolean;
}

export interface PromotionDecision {
  allowed: boolean;
  /** Five-criteria evaluator result for transparency in UI. */
  reasons: Array<{ id: "PG-1" | "PG-2" | "PG-3" | "PG-4" | "PG-5"; passed: boolean; detail: string }>;
  /** When `allowed === false`, the dominant reason. */
  blockedBy: "PG-1" | "PG-2" | "PG-3" | "PG-4" | "PG-5" | null;
}

export const RELIABILITY_THRESHOLD = 0.95;
export const MIN_OBSERVATION_COUNT = 50;

/**
 * Decide whether to promote a surface from current to target rung.
 *
 * Compliance-class never reaches Automatic, regardless of any other
 * input. This is hard-coded.
 */
export function evaluatePromotion(input: PromotionInputs): PromotionDecision {
  const reasons: PromotionDecision["reasons"] = [];

  // Compliance-class hard-coded exclusion from Automatic
  if (input.workloadClass === "compliance" && input.target === "Automatic") {
    return {
      allowed: false,
      reasons: [
        { id: "PG-4", passed: false, detail: "Compliance-class workloads are hard-coded out of Automatic rung; counsel-review cannot override." },
      ],
      blockedBy: "PG-4",
    };
  }

  // Must be a single-step promotion (skipping rungs is not allowed).
  const cIdx = RUNG_ORDER.indexOf(input.current);
  const tIdx = RUNG_ORDER.indexOf(input.target);
  if (tIdx !== cIdx + 1) {
    return {
      allowed: false,
      reasons: [{ id: "PG-1", passed: false, detail: `Promotion must be single-step; got ${input.current} -> ${input.target}` }],
      blockedBy: "PG-1",
    };
  }

  // PG-1 reliability
  const successRate = input.totalObservations === 0 ? 0 : input.successCount / input.totalObservations;
  const pg1Pass = successRate >= RELIABILITY_THRESHOLD;
  reasons.push({
    id: "PG-1",
    passed: pg1Pass,
    detail: `success rate ${(successRate * 100).toFixed(1)}% vs ${RELIABILITY_THRESHOLD * 100}% threshold`,
  });

  // PG-2 coverage
  const pg2Pass = input.totalObservations >= MIN_OBSERVATION_COUNT;
  reasons.push({
    id: "PG-2",
    passed: pg2Pass,
    detail: `observations ${input.totalObservations} vs ${MIN_OBSERVATION_COUNT} threshold`,
  });

  // PG-3 no-incidents
  const pg3Pass = input.incidentCount === 0;
  reasons.push({ id: "PG-3", passed: pg3Pass, detail: `incidents ${input.incidentCount}` });

  // PG-4 counsel-cleared
  const pg4Pass = input.counselReviewStatus === "cleared";
  reasons.push({
    id: "PG-4",
    passed: pg4Pass,
    detail: `counsel review status: ${input.counselReviewStatus}`,
  });

  // PG-5 tenant opt-in
  reasons.push({ id: "PG-5", passed: input.tenantOptedIn, detail: input.tenantOptedIn ? "tenant has opted in" : "tenant has not opted in" });

  const blocker = reasons.find((r) => !r.passed);
  return {
    allowed: !blocker,
    reasons,
    blockedBy: blocker?.id ?? null,
  };
}

export interface DemotionInputs {
  current: AdminRung;
  /** True if a recent incident requires rollback. */
  hadIncident: boolean;
  /** Successful observations in the rolling window. */
  recentSuccessCount: number;
  /** Total observations in the rolling window. */
  recentTotalObservations: number;
  /** Tenant has counsel-cleared opt-out from automatic demotion. */
  tenantOptOutFromAutoDemotion: boolean;
}

export interface DemotionDecision {
  shouldDemote: boolean;
  next: AdminRung;
  reason: string;
}

/**
 * Demote one rung automatically when:
 *  - an incident requires rollback, or
 *  - sustained reliability dip below threshold,
 * unless the tenant has a counsel-cleared opt-out.
 */
export function evaluateDemotion(input: DemotionInputs): DemotionDecision {
  if (input.tenantOptOutFromAutoDemotion) {
    return { shouldDemote: false, next: input.current, reason: "tenant opt-out from auto-demotion" };
  }
  const cIdx = RUNG_ORDER.indexOf(input.current);
  if (cIdx <= 0) return { shouldDemote: false, next: input.current, reason: "already at Manual rung" };

  if (input.hadIncident) {
    return { shouldDemote: true, next: RUNG_ORDER[cIdx - 1], reason: "incident required rollback" };
  }
  const rate = input.recentTotalObservations === 0 ? 1 : input.recentSuccessCount / input.recentTotalObservations;
  if (input.recentTotalObservations >= MIN_OBSERVATION_COUNT && rate < RELIABILITY_THRESHOLD) {
    return {
      shouldDemote: true,
      next: RUNG_ORDER[cIdx - 1],
      reason: `reliability dip ${(rate * 100).toFixed(1)}% below ${RELIABILITY_THRESHOLD * 100}%`,
    };
  }
  return { shouldDemote: false, next: input.current, reason: "no demotion criterion met" };
}
