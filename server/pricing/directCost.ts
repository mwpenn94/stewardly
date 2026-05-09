/**
 * Stewardly pricing — Provider DirectCost passthrough
 * =====================================================
 *
 * Per PHASE1_BRIEF.md commitments C-2 (three-component pricing), C-22
 * (BYO first-class), and C-24 (economic anchor for non-competition), the
 * provider-side direct cost (the `apiUsd` field of `IntentCost`) is
 * passed through to the customer at ZERO MARKUP on the internal-bundled
 * path, and is absent from Stewardly's invoice on the BYO path.
 *
 * The zero-markup invariant is the load-bearing constraint of the
 * non-competition economic anchor: a platform that captures any margin
 * on provider DirectCost has economic incentive to grow token volume
 * (and therefore to compete with the foundation-model providers). By
 * structurally enforcing zero markup on apiUsd, Stewardly removes that
 * incentive at the architectural level.
 *
 * Invariants (enforced by `__tests__/directCost.test.ts`):
 *   DC-1: directCostPassthroughUsd === apiUsd  (internal-bundled path)
 *   DC-2: directCostPassthroughUsd === 0       (BYO path)
 *   DC-3: directCostPassthroughUsd has 0% markup vs apiUsd, ALWAYS
 *   DC-4: there is no tenant override that can change DC-1 / DC-2 / DC-3
 *         (the zero-markup constraint is non-overridable; this is part of
 *         the customer-protection covenant and the AI non-competition
 *         compliance covenant)
 */

import type { IntentCost } from "../engines/_intent";
import type { ConsumptionPath } from "./index";

/**
 * Pass through provider DirectCost at zero markup.
 *
 * On internal-bundled: returns intentCost.apiUsd verbatim.
 * On BYO: returns 0 (the customer paid the provider directly; Stewardly's
 * invoice does not double-bill).
 *
 * NO TENANT OVERRIDE. NO MARKUP. EVER.
 */
export function passthroughDirectCost(cost: IntentCost, path: ConsumptionPath): number {
  if (path === "byo") {
    return 0;
  }

  // Internal-bundled: zero-markup passthrough.
  return cost.apiUsd;
}
