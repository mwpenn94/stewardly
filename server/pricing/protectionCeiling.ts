/**
 * Stewardly pricing — Customer-protection ceiling
 * =================================================
 *
 * Per PHASE1_BRIEF.md commitment C-2, the customer is never invoiced above
 * the cost-plus-equivalent of all three components, regardless of which
 * stage of the cost / ROI / savings calculation is operating. The ceiling
 * is the inviolable upper bound of the customer invoice. It is NOT a
 * Stewardly-side margin protection; it is a customer-side protection
 * covenant that binds Stewardly to a maximum invoice even when
 * MeasuredSavings is large and the resulting ValueShare would otherwise
 * exceed it.
 *
 * The cost-plus-equivalent ceiling is defined as: the price the customer
 * would have paid had the platform been priced as a pure cost-plus model
 * (no ValueShare component). Specifically:
 *
 *   ceilingUsd = (1 + ceilingMarkup) * (operationalBasis + apiUsd_on_path)
 *
 *   where:
 *     - ceilingMarkup is the customer-protection ceiling markup, nominally
 *       0.50 (50%) — this is intentionally HIGHER than the operational
 *       cost-plus markup (default 30%) because the ceiling is the
 *       *upper bound* not the typical price; it must be high enough to
 *       not bind in normal MeasuredSavings outcomes but low enough to
 *       provide meaningful protection in degenerate accounting scenarios.
 *     - operationalBasis is the same as in costPlus.ts
 *     - apiUsd_on_path is intentCost.apiUsd on internal-bundled, 0 on BYO
 *
 * Invariants (enforced by `__tests__/protectionCeiling.test.ts`):
 *   PC-1: ceilingUsd > 0 whenever the intent actually executed
 *   PC-2: customerInvoiceUsd <= ceilingUsd (the ceiling is the hard cap)
 *   PC-3: the ceilingMarkup is hard-bounded; no tenant override can raise
 *         it above CEILING_MARKUP_CAP
 *   PC-4: when the ceiling binds (rawTotal > ceiling), ceilingApplied is
 *         true so the customer-facing UI can surface the protection
 *   PC-5: BYO path's ceiling EXCLUDES apiUsd from the basis (the customer
 *         paid the provider directly; Stewardly's ceiling is on what
 *         Stewardly invoices, not on total customer spend)
 */

import type { IntentCost } from "../engines/_intent";
import { operationalBasis } from "./costPlus";
import type { ConsumptionPath } from "./index";

const DEFAULT_CEILING_MARKUP = 0.5;
const CEILING_MARKUP_CAP = 1.5; // 150%

export function getTenantCeilingMarkup(tenantId: string): number {
  void tenantId;
  return DEFAULT_CEILING_MARKUP;
}

export interface ProtectionCeilingInput {
  rawTotalUsd: number;
  intentCost: IntentCost;
  path: ConsumptionPath;
  tenantId: string;
}

export interface ProtectionCeilingResult {
  ceilingUsd: number;
  ceilingApplied: boolean;
  finalUsd: number;
}

export function applyProtectionCeiling(input: ProtectionCeilingInput): ProtectionCeilingResult {
  const rawCeilingMarkup = getTenantCeilingMarkup(input.tenantId);
  const ceilingMarkup = Math.max(0, Math.min(CEILING_MARKUP_CAP, rawCeilingMarkup));

  const opsBasis = operationalBasis(input.intentCost);
  const apiBasis = input.path === "internal-bundled" ? input.intentCost.apiUsd : 0;

  const ceilingUsd = (1 + ceilingMarkup) * (opsBasis + apiBasis);

  const ceilingApplied = input.rawTotalUsd > ceilingUsd;
  const finalUsd = ceilingApplied ? ceilingUsd : input.rawTotalUsd;

  return { ceilingUsd, ceilingApplied, finalUsd };
}
