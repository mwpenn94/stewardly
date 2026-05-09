/**
 * Stewardly pricing — ValueShare(MeasuredSavings)
 * ================================================
 *
 * Per PHASE1_BRIEF.md commitment C-2, ValueShare is the primary revenue
 * instrument. The customer pays Stewardly a share of the validated
 * efficiency gain (MeasuredSavings) Stewardly produced for them.
 *
 * Invariants (enforced by `__tests__/valueShare.test.ts`):
 *   - V-1: ValueShare >= 0 always (Stewardly never invoices negative
 *     ValueShare even when MeasuredSavings is negative)
 *   - V-2: ValueShare = rate * max(0, MeasuredSavings)
 *   - V-3: rate ∈ [0, 1] for any tenant (nominally 0.20 — 20% of validated
 *     savings — but configurable per tenant within [0, 1])
 *   - V-4: Identical formula across internal-bundled and BYO paths
 *     (commitment C-22: BYO is first-class with identical Stewardly economics)
 */

/**
 * Default ValueShare rate. Configurable per tenant via the
 * `tenantValueShareRate` lookup. The default is 0.20 (20% of MeasuredSavings)
 * which sits within typical Energy-as-a-Service / shared-savings industry
 * norms. PHASE1_BRIEF.md does not bind a specific number; this is a
 * judgment call (D-A) that defaults to 0.20 pending product-marketing
 * input or counsel-reviewed contractual language.
 */
const DEFAULT_VALUE_SHARE_RATE = 0.2;

/**
 * Tenant overrides. In production this is loaded from the database; for
 * now we expose a stub that returns the default. Wave C (identity &
 * governance) will wire tenant-specific overrides to the policy plane.
 */
export function getTenantValueShareRate(tenantId: string): number {
  // TODO Wave C: load from tenant policy. For now: default for all tenants.
  void tenantId;
  return DEFAULT_VALUE_SHARE_RATE;
}

/**
 * Compute ValueShare for a single intent or billing slice.
 *
 *   ValueShare = rate * max(0, MeasuredSavings)
 *
 * The max(0, ...) floor is what enforces invariant V-1: Stewardly never
 * invoices a negative ValueShare. If MeasuredSavings is negative for a
 * given period (e.g., the customer's empirical cost rose vs baseline),
 * the customer is not charged ValueShare — but they are still charged the
 * app/operational cost-plus and any DirectCost passthrough on internal-
 * bundled. This preserves Stewardly's profitability floor (C-22) without
 * penalizing the customer for negative outcomes outside Stewardly's
 * direct control.
 */
export function computeValueShare(measuredSavingsUsd: number, tenantId: string): number {
  const rate = getTenantValueShareRate(tenantId);

  // V-3: rate must be in [0, 1]. Clamp defensively.
  const clampedRate = Math.max(0, Math.min(1, rate));

  // V-1: ValueShare floored at 0.
  const positiveMeasuredSavings = Math.max(0, measuredSavingsUsd);

  return clampedRate * positiveMeasuredSavings;
}
