/**
 * Wealth calculators — Intent handler for missional.wealth.calculate
 *
 * Wraps the ported pure-math wealth engine (calculators-core, originally
 * `@manus-next/wealth-engine`) and the higher-level legacy composite
 * engines (UWE / BIE / HE / SCUI under wealth-engines-legacy) and exposes
 * them through the Intent contract.
 *
 * The pure-math engine has zero external dependencies and is safe to run
 * server-side or in a worker. It emits the same numbers the prior
 * stewardly-ai HTML calculators produced and is the canonical source of
 * truth for the unified wealth engine (recursive optimization spec).
 */

import type { EngineContext, Intent, IntentResult } from "../../_intent";
import { emptyCost } from "../../_intent";

// Pure-math wealth engine (46 calculator methods, 14 product models).
import * as core from "./calculators-core/engine";

// Legacy composite engines kept available for the higher-order flows
// (Holistic, Stress/Compliance, Business Income).
import * as legacy from "./wealth-engines-legacy";

/**
 * Calculator method names recognized by missional.wealth.calculate.
 *
 * The list mirrors the public API of `calculators-core` plus a small set
 * of named composite flows from the legacy engines.
 */
export type WealthCalculatorMethod =
  // Core protection & growth
  | "cashFlow" | "protection" | "growth" | "retirement"
  | "tax" | "estate" | "education"
  // Product models
  | "modelTerm" | "modelIUL" | "modelWL" | "modelDI" | "modelLTC" | "modelFIA"
  // Premium estimate
  | "estPrem"
  // Scorecard / recommendations
  | "computeScorecard" | "buildRecommendations"
  // Horizon / action plan
  | "buildHorizonData" | "buildActionPlan"
  // Advanced
  | "calcAdvanced" | "calcBizClient" | "calcPartner"
  | "calcIncomeStreams" | "calcBucketStrategy"
  | "calcFloorUpside" | "calcGuytonKlinger" | "calcRothLadder"
  // Composite (legacy)
  | "uwe.simulate" | "uwe.monteCarlo"
  | "he.simulate" | "he.compareStrategies" | "he.milestoneCompare" | "he.backPlanHolistic"
  | "scui.historicalBacktest" | "scui.stressTest" | "scui.checkGuardrails"
  | "bie.simulate";

export interface WealthCalculatePayload {
  method: WealthCalculatorMethod;
  args: unknown[];
}

type LooseFn = (...args: unknown[]) => unknown;
const c = core as unknown as Record<string, LooseFn>;
const l = legacy as unknown as Record<string, LooseFn> & { BIE: new () => { simulate: (c: unknown) => unknown } };

const coreDispatch: Partial<Record<WealthCalculatorMethod, LooseFn>> = {
  cashFlow: (...a) => c.calcCashFlow(...a),
  protection: (...a) => c.calcProtection(...a),
  growth: (...a) => c.calcGrowth(...a),
  retirement: (...a) => c.calcRetirement(...a),
  tax: (...a) => c.calcTax(...a),
  estate: (...a) => c.calcEstate(...a),
  education: (...a) => c.calcEducation(...a),
  modelTerm: (...a) => c.modelTerm(...a),
  modelIUL: (...a) => c.modelIUL(...a),
  modelWL: (...a) => c.modelWL(...a),
  modelDI: (...a) => c.modelDI(...a),
  modelLTC: (...a) => c.modelLTC(...a),
  modelFIA: (...a) => c.modelFIA(...a),
  estPrem: (...a) => c.estPrem(...a),
  computeScorecard: (...a) => c.computeScorecard(...a),
  buildRecommendations: (...a) => c.buildRecommendations(...a),
  buildHorizonData: (...a) => c.buildHorizonData(...a),
  buildActionPlan: (...a) => c.buildActionPlan(...a),
  calcAdvanced: (...a) => c.calcAdvanced(...a),
  calcBizClient: (...a) => c.calcBizClient(...a),
  calcPartner: (...a) => c.calcPartner(...a),
  calcIncomeStreams: (...a) => c.calcIncomeStreams(...a),
  calcBucketStrategy: (...a) => c.calcBucketStrategy(...a),
  calcFloorUpside: (...a) => c.calcFloorUpside(...a),
  calcGuytonKlinger: (...a) => c.calcGuytonKlinger(...a),
  calcRothLadder: (...a) => c.calcRothLadder(...a),
};

const legacyDispatch: Partial<Record<WealthCalculatorMethod, LooseFn>> = {
  "uwe.simulate": (...a) => l.simulateUWE(...a),
  "uwe.monteCarlo": (...a) => l.monteCarlo(...a),
  "he.simulate": (...a) => l.simulateHE(...a),
  "he.compareStrategies": (...a) => l.compareStrategies(...a),
  "he.milestoneCompare": (...a) => l.milestoneCompare(...a),
  "he.backPlanHolistic": (...a) => l.backPlanHolistic(...a),
  "scui.historicalBacktest": (...a) => l.historicalBacktest(...a),
  "scui.stressTest": (...a) => l.stressTest(...a),
  "scui.checkGuardrails": (...a) => l.checkGuardrails(...a),
  // BIE.simulate lives on the BIE class; expose a thin wrapper.
  "bie.simulate": (config) => new l.BIE().simulate(config),
};

export async function runWealthCalculator(
  ctx: EngineContext,
  intent: Intent<unknown>,
): Promise<IntentResult> {
  const payload = intent.payload as Partial<WealthCalculatePayload>;
  const method = payload?.method;
  const args = Array.isArray(payload?.args) ? payload.args : [];

  if (!method) {
    return {
      ok: false,
      error: { code: "BAD_PAYLOAD", message: "missional.wealth.calculate requires { method, args[] }" },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }

  const fn = coreDispatch[method] ?? legacyDispatch[method];
  if (!fn) {
    return {
      ok: false,
      error: { code: "UNKNOWN_METHOD", message: `Unknown wealth calculator method "${method}"` },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }

  try {
    const data = fn(...args);
    return {
      ok: true,
      data: data as never,
      invoked: [],
      cost: emptyCost(),
      qualityScore: 1,
      auditId: ctx.meta.correlationId,
    };
  } catch (e) {
    const err = e as Error;
    ctx.log("error", "missional.wealth.calculate failure", { method, message: err.message });
    return {
      ok: false,
      error: { code: "CALC_FAILED", message: err.message },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }
}
