/**
 * Stewardly pricing — Four-scenario BYO equivalence
 * ====================================================
 *
 * Per PHASE1_BRIEF.md commitment C-22 and the AFK mandate L079
 * ("BYOM first-class with identical Stewardly economics across all four
 * scenarios"), the four scenarios are:
 *
 *   S1: Stewardly provides AI, Stewardly provides surface
 *       (internal-bundled path; both paths' economic components fully
 *       active)
 *
 *   S2: Stewardly provides AI, customer provides surface
 *       (internal-bundled path; the customer brings their own client
 *       UI / agent / tool but consumes Stewardly's bundled provider)
 *
 *   S3: Customer provides AI, Stewardly provides surface
 *       (BYO path; the customer brings their own provider contract;
 *       Stewardly hosts the surface)
 *
 *   S4: Customer provides AI, customer provides surface
 *       (BYO path; Stewardly is purely substrate / governance /
 *       measurement infrastructure)
 *
 * The "identical Stewardly economics" claim resolves to: identical
 * **return to Stewardly per unit of customer value delivered**, NOT
 * identical price formulas. Specifically:
 *
 *   - On S1 and S2 (internal-bundled), all three pricing components are
 *     non-zero: ValueShare + appOperationalCostPlus + DirectCostPassthrough.
 *
 *   - On S3 and S4 (BYO), DirectCostPassthrough = 0 (customer paid the
 *     provider directly), and the customer's invoice from Stewardly is
 *     ValueShare + appOperationalCostPlus only.
 *
 *   - Stewardly's economic return per dollar of MeasuredSavings is the
 *     same across all four scenarios:
 *       returnPerSavingsDollar = valueShareRate
 *     (because ValueShare is the only outcome-coupled component, and the
 *     valueShareRate is path-independent).
 *
 *   - Stewardly's economic return per dollar of operational expense is
 *     the same across all four scenarios:
 *       returnPerOperationalDollar = operationalMarkup
 *     (because the operational cost-plus is path-independent).
 *
 *   - Stewardly's economic return per dollar of provider DirectCost is
 *     ZERO across all four scenarios (zero-markup invariant DC-3, the
 *     load-bearing constraint of the non-competition economic anchor).
 *
 * Invariants (enforced by `__tests__/byoScenarios.test.ts`):
 *   BS-1: For identical IntentCost and identical MeasuredSavings, the
 *         valueShareUsd is identical across all four scenarios.
 *   BS-2: For identical IntentCost, the appOperationalUsd is identical
 *         across all four scenarios.
 *   BS-3: directCostPassthroughUsd === apiUsd on S1, S2; === 0 on S3, S4.
 *   BS-4: returnPerProviderDirectCostDollar === 0 on all four scenarios
 *         (Stewardly captures zero margin on provider DirectCost).
 */

import type { IntentCost } from "../engines/_intent";
import type { ConsumptionPath, PricingLineItem } from "./index";
import { computePricingLine } from "./index";

export type ByoScenario = "S1" | "S2" | "S3" | "S4";

export function scenarioPath(scenario: ByoScenario): ConsumptionPath {
  // S1 + S2 = internal-bundled (Stewardly bears DirectCost)
  // S3 + S4 = BYO (customer bears DirectCost directly)
  if (scenario === "S1" || scenario === "S2") return "internal-bundled";
  return "byo";
}

export interface ScenarioComparisonInput {
  intentCost: IntentCost;
  measuredSavingsUsd: number;
  tenantId: string;
}

export interface ScenarioComparisonResult {
  S1: PricingLineItem;
  S2: PricingLineItem;
  S3: PricingLineItem;
  S4: PricingLineItem;
}

/**
 * Compute the pricing line for the same IntentCost / MeasuredSavings
 * across all four scenarios. Used by `__tests__/byoScenarios.test.ts` to
 * verify the equivalence invariants BS-1 through BS-4.
 */
export function comparePricingAcrossScenarios(
  input: ScenarioComparisonInput,
): ScenarioComparisonResult {
  const scenarios: ByoScenario[] = ["S1", "S2", "S3", "S4"];
  const result = {} as ScenarioComparisonResult;
  for (const s of scenarios) {
    result[s] = computePricingLine({
      intentCost: input.intentCost,
      measuredSavingsUsd: input.measuredSavingsUsd,
      path: scenarioPath(s),
      tenantId: input.tenantId,
    });
  }
  return result;
}
