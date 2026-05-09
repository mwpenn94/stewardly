/**
 * Stewardly pricing — Cost-Plus on app/operational expenses
 * ==========================================================
 *
 * Per PHASE1_BRIEF.md commitments C-2 (three-component pricing) and C-22
 * (profitability floor on both paths), Stewardly recovers its actual cost
 * of running the platform — the operational expense items in `IntentCost`
 * EXCLUDING the provider-side apiUsd — through a defined cost-plus markup.
 *
 * The components included in this app/operational basis are:
 *   bandwidthUsd, storageUsd, hardwareUsd, electricityUsd, perSeatDisplacedUsd
 *
 * The component EXCLUDED from this basis is `apiUsd`, because apiUsd is the
 * provider-side DirectCost that flows through `directCost.ts` at zero
 * markup (commitment C-2 third component, C-24 economic anchor).
 *
 * Invariants (enforced by `__tests__/costPlus.test.ts`):
 *   CP-1: appOperationalUsd > 0 whenever any operational component > 0
 *   CP-2: apiUsd is NEVER part of the cost-plus basis
 *   CP-3: markup ∈ [0, MARKUP_CAP] for any tenant (nominally 0.30 — 30% — but
 *         configurable per tenant within [0, MARKUP_CAP])
 *   CP-4: Identical formula across internal-bundled and BYO paths
 *         (path-independence: the operational cost-plus does not change
 *         when the path changes)
 *   CP-5: appOperationalUsd = (1 + markup) * sum(bandwidth + storage +
 *         hardware + electricity + perSeatDisplaced)
 */

import type { IntentCost } from "../engines/_intent";

/**
 * Default operational cost-plus markup. Pricing-strategy judgment call;
 * documented as Phase 1 brief D-A. Defaults to 0.30 (30%) pending product-
 * marketing input. Range [0, MARKUP_CAP]; values above MARKUP_CAP are
 * treated as a configuration error and clamped.
 */
const DEFAULT_OPERATIONAL_MARKUP = 0.3;

/**
 * Hard cap on the operational markup, regardless of tenant override.
 * This is part of the customer-protection covenant: Stewardly can adjust
 * markup downward per tenant but not upward beyond this cap.
 */
const MARKUP_CAP = 1.0; // 100%

/**
 * Tenant-specific operational markup override. Wave C wires this to the
 * tenant policy plane; for now the default applies to all tenants.
 */
export function getTenantOperationalMarkup(tenantId: string): number {
  void tenantId;
  return DEFAULT_OPERATIONAL_MARKUP;
}

/**
 * Sum of the operational basis from an IntentCost. EXCLUDES apiUsd, which
 * is provider DirectCost and flows through directCost.ts at zero markup.
 */
export function operationalBasis(cost: IntentCost): number {
  return (
    cost.bandwidthUsd +
    cost.storageUsd +
    cost.hardwareUsd +
    cost.electricityUsd +
    cost.perSeatDisplacedUsd
  );
}

/**
 * Apply cost-plus markup to the app/operational basis. Path-independent:
 * the same formula applies on internal-bundled and BYO. This is what
 * preserves Stewardly's profitability floor on both paths (C-22).
 */
export function applyAppOperationalCostPlus(cost: IntentCost, tenantId: string): number {
  const rawMarkup = getTenantOperationalMarkup(tenantId);
  const markup = Math.max(0, Math.min(MARKUP_CAP, rawMarkup));
  const basis = operationalBasis(cost);
  return basis * (1 + markup);
}
