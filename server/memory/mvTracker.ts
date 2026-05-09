/**
 * Wave D — Measurement & Verification (M&V) tracker
 * ====================================================
 *
 * Commitment C-22: MeasuredSavings is the gating signal for ValueShare.
 * The M&V tracker computes a single number, in USD, attributable to a
 * given intent (or aggregated over a billing period) using a two-stage
 * methodology:
 *
 *   Stage 1 — Forward projection (Days 1–30)
 *     The intent's projected savings, computed from baseline and the
 *     intent's design-time savings model. Used when there is not yet
 *     enough empirical signal to weight the result.
 *
 *   Stage 2 — Empirical M&V (Days 31–90+)
 *     The intent's measured savings, computed from observed before/after
 *     metrics. Used once the empirical sample is sufficient.
 *
 * Blend window — Days 1–90:
 *     A linear blend between Stage 1 and Stage 2 over the 90-day window.
 *     At Day 1: 100% projection, 0% empirical.
 *     At Day 90: 0% projection, 100% empirical.
 *     Linear weight: w_empirical = clamp((dayIndex - 1) / 89, 0, 1)
 *
 * The methodology is governed by counsel gate CG-1
 * ("Aggregate-assumption M&V methodology") — when CG-1 is not cleared,
 * no Stage 1 projection may be invoiced; the system falls back to
 * "Stage 1 = 0" until counsel clears the methodology.
 *
 * This module is pure and testable.
 */

import type { CounselGateRecord } from "../governance/counselGates";

export interface MVInputs {
  /** Day index since the intent first ran. Day 1 = first day. */
  dayIndex: number;
  /** Stage 1 forward-projected savings (USD). */
  projectedUsd: number;
  /** Stage 2 empirical savings (USD). 0 when not yet measured. */
  empiricalUsd: number;
  /** Whether CG-1 (aggregate-assumption M&V) is cleared. When not cleared, projectedUsd is treated as 0. */
  cg1: CounselGateRecord;
}

export interface MVOutput {
  measuredSavingsUsd: number;
  /** 0..1 blend weight that was applied to the empirical component. */
  empiricalWeight: number;
  /** True when the methodology gate forced a 0-projection fallback. */
  cg1Forced: boolean;
}

const BLEND_WINDOW_DAYS = 90;

export function computeMeasuredSavings(input: MVInputs): MVOutput {
  const cg1Cleared = input.cg1.state === "cleared";
  const safeProjected = cg1Cleared ? input.projectedUsd : 0;
  const w = Math.max(0, Math.min(1, (input.dayIndex - 1) / (BLEND_WINDOW_DAYS - 1)));
  const blended = safeProjected * (1 - w) + input.empiricalUsd * w;
  return {
    measuredSavingsUsd: Math.max(0, blended), // never negative
    empiricalWeight: w,
    cg1Forced: !cg1Cleared,
  };
}

/**
 * Aggregate per-intent M&V outputs into a billing-period total.
 * Aggregation is straight summation; the per-intent ceiling lives in
 * the pricing module.
 */
export function aggregateMV(rows: readonly MVOutput[]): { measuredSavingsUsd: number; sampleCount: number } {
  return {
    measuredSavingsUsd: rows.reduce((acc, r) => acc + r.measuredSavingsUsd, 0),
    sampleCount: rows.length,
  };
}
