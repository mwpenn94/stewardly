/**
 * Stewardly pricing — three-component model
 * ==========================================
 *
 * Per PHASE1_BRIEF.md commitments C-2, C-22, C-24, this module computes the
 * customer invoice line for a single Intent execution. The invoice has three
 * components, applied in this fixed order:
 *
 *   1. ValueShare(MeasuredSavings)       — primary revenue instrument
 *      Captured on validated efficiency gains. Drives the customer-pays-for-
 *      outcome economic posture. Computed by `valueShare.ts` from the
 *      MeasuredSavings number produced by `measuredSavings.ts` (the two-
 *      stage methodology: Stage 1 forward projection blending into Stage 2
 *      empirical M&V over Days 1-90).
 *
 *   2. Cost-Plus on app/operational expenses    — profitability floor
 *      Stewardly's actual cost of running the platform — compute, storage,
 *      observability, internal substrate, support — recovered with a
 *      defined cost-plus markup. Always non-zero on both internal-bundled
 *      and BYO paths because Stewardly always incurs operational cost when
 *      it serves a request.
 *
 *   3. Provider DirectCost (when applicable)   — zero-markup passthrough
 *      On the internal-bundled path, Stewardly contracts with the provider
 *      on the customer's behalf, so DirectCost is non-zero and is passed
 *      through at zero markup. On the BYO path, DirectCost is zero on
 *      Stewardly's invoice (the customer pays the provider directly).
 *
 * The total is then capped at a customer-protection ceiling (see
 * `protectionCeiling.ts`): the customer is never invoiced above the
 * cost-plus-equivalent of all three components — this is the inviolable
 * upper bound regardless of MeasuredSavings outcomes.
 *
 * Both internal-bundled and BYO paths preserve Stewardly's profitability
 * floor through the always-present app/operational cost-plus component.
 * The platform never runs unprofitably regardless of path or measurement-
 * stage outcome.
 *
 * The non-competition economic anchor (C-24) is structurally enforced by
 * the shape of these three components: ValueShare scales with outcome
 * (decoupled from token volume), app/operational cost-plus scales with
 * infrastructure cost (sub-linear in token volume due to amortization
 * across customers), and DirectCost has zero markup. None of these
 * components scale margin with foundation-model token volume, so the
 * platform cannot finance becoming a foundation-model provider from this
 * revenue model.
 */

import type { IntentCost } from "../engines/_intent";
import { computeValueShare } from "./valueShare";
import { applyAppOperationalCostPlus } from "./costPlus";
import { passthroughDirectCost } from "./directCost";
import { applyProtectionCeiling } from "./protectionCeiling";

/**
 * Path discriminator. Internal-bundled = Stewardly contracts with the
 * provider on the customer's behalf. BYO = customer brings their own
 * provider contract; Stewardly never sees the provider invoice.
 */
export type ConsumptionPath = "internal-bundled" | "byo";

export interface PricingInput {
  /**
   * The IntentCost emitted by the substrate router for this single Intent.
   * Already six-pass measured per v3 §3 (apiUsd, bandwidthUsd, storageUsd,
   * hardwareUsd, electricityUsd, perSeatDisplacedUsd).
   */
  intentCost: IntentCost;

  /**
   * Which consumption path was used for this intent.
   *  - "internal-bundled" includes provider-side DirectCost in the invoice
   *    (passed through at zero markup).
   *  - "byo" excludes provider-side DirectCost from the invoice; the
   *    customer pays the provider directly.
   */
  path: ConsumptionPath;

  /**
   * MeasuredSavings (USD) attributable to this intent under the two-stage
   * methodology. May be 0 (e.g., during pure-projection Stage 1 with no
   * empirical signal yet) or negative (Stewardly never invoices a
   * negative ValueShare; floor at 0 in `valueShare.ts`).
   */
  measuredSavingsUsd: number;

  /**
   * Tenant identifier for tenant-specific pricing parameters (markup
   * percentage, ValueShare rate, ceiling formula). Defaults are used when
   * tenant-specific overrides are absent.
   */
  tenantId: string;
}

export interface PricingLineItem {
  /** Customer-facing line: ValueShare on MeasuredSavings. Always >= 0. */
  valueShareUsd: number;

  /**
   * Customer-facing line: cost-plus on Stewardly's app/operational expenses
   * (compute, storage, observability, support amortized share). Always > 0
   * when the intent actually executed.
   */
  appOperationalUsd: number;

  /**
   * Customer-facing line: provider DirectCost passthrough. Zero markup.
   * Zero on BYO path (provider invoice goes to customer directly).
   */
  directCostPassthroughUsd: number;

  /**
   * Sum of the three components before the protection ceiling is applied.
   */
  rawTotalUsd: number;

  /**
   * The customer-protection ceiling (cost-plus-equivalent of all three
   * components). Final invoice cannot exceed this regardless of
   * MeasuredSavings outcome. See `protectionCeiling.ts`.
   */
  ceilingUsd: number;

  /**
   * Final customer invoice for this intent. equals min(rawTotalUsd, ceilingUsd).
   */
  customerInvoiceUsd: number;

  /**
   * True when ceilingUsd was binding (rawTotalUsd > ceilingUsd). Surfaced
   * on customer-facing UI (Wave E) so the customer-protection covenant is
   * visible.
   */
  ceilingApplied: boolean;

  /**
   * Path discriminator (echo from input).
   */
  path: ConsumptionPath;
}

/**
 * Compute the three-component pricing line item for a single intent.
 *
 * Invariants enforced (verified by `__tests__/pricing.invariants.test.ts`):
 *   I-1: customerInvoiceUsd >= 0
 *   I-2: customerInvoiceUsd <= ceilingUsd  (ceiling never exceeded)
 *   I-3: directCostPassthroughUsd has 0% markup over substrate's apiUsd
 *        (verified by spot-check that directCostPassthroughUsd === apiUsd
 *        on internal-bundled, 0 on BYO)
 *   I-4: appOperationalUsd > 0 whenever the intent actually executed
 *        (profitability floor)
 *   I-5: valueShareUsd >= 0  (Stewardly never invoices negative ValueShare)
 *   I-6: BYO four-scenario equivalence — see `byoScenarios.ts`
 *   I-7: Non-scaling-margin — see `nonCompetition.ts`
 */
export function computePricingLine(input: PricingInput): PricingLineItem {
  const valueShareUsd = computeValueShare(input.measuredSavingsUsd, input.tenantId);
  const appOperationalUsd = applyAppOperationalCostPlus(input.intentCost, input.tenantId);
  const directCostPassthroughUsd = passthroughDirectCost(input.intentCost, input.path);

  const rawTotalUsd = valueShareUsd + appOperationalUsd + directCostPassthroughUsd;

  const { ceilingUsd, ceilingApplied, finalUsd } = applyProtectionCeiling({
    rawTotalUsd,
    intentCost: input.intentCost,
    path: input.path,
    tenantId: input.tenantId,
  });

  return {
    valueShareUsd,
    appOperationalUsd,
    directCostPassthroughUsd,
    rawTotalUsd,
    ceilingUsd,
    customerInvoiceUsd: finalUsd,
    ceilingApplied,
    path: input.path,
  };
}

/**
 * Aggregate pricing across multiple intents (e.g., a billing-period roll-up).
 * Component sums are straightforward; the ceiling is applied per-intent
 * (not as a billing-period total ceiling), which is the correct semantics
 * because the customer-protection covenant is per-intent.
 */
export function aggregatePricingLines(lines: PricingLineItem[]): {
  valueShareUsd: number;
  appOperationalUsd: number;
  directCostPassthroughUsd: number;
  rawTotalUsd: number;
  customerInvoiceUsd: number;
  ceilingAppliedCount: number;
} {
  return lines.reduce(
    (acc, line) => ({
      valueShareUsd: acc.valueShareUsd + line.valueShareUsd,
      appOperationalUsd: acc.appOperationalUsd + line.appOperationalUsd,
      directCostPassthroughUsd: acc.directCostPassthroughUsd + line.directCostPassthroughUsd,
      rawTotalUsd: acc.rawTotalUsd + line.rawTotalUsd,
      customerInvoiceUsd: acc.customerInvoiceUsd + line.customerInvoiceUsd,
      ceilingAppliedCount: acc.ceilingAppliedCount + (line.ceilingApplied ? 1 : 0),
    }),
    {
      valueShareUsd: 0,
      appOperationalUsd: 0,
      directCostPassthroughUsd: 0,
      rawTotalUsd: 0,
      customerInvoiceUsd: 0,
      ceilingAppliedCount: 0,
    },
  );
}
