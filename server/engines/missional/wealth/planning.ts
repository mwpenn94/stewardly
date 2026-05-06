/**
 * Wealth planning — Intent handler for missional.wealth.plan
 *
 * Composes the calculator core (cash flow, protection, growth, retirement,
 * tax, estate, education) into a holistic plan proposal. The signatures
 * of the underlying core functions are positional (legacy), so this
 * handler accepts a structured `WealthPlanInput` and forwards each
 * sub-calculator the positional argument list it expects.
 *
 * The output is a structured plan that the substrate's proposal-generator
 * wraps into a costed proposal for practitioner review at the configured
 * admin level.
 */

import type { EngineContext, Intent, IntentResult } from "../../_intent";
import { emptyCost } from "../../_intent";
import * as core from "./calculators-core/engine";

export interface WealthPlanInput {
  household: {
    age: number;
    spouseAge?: number;
    grossIncome: number;
    spouseIncome?: number;
    deps?: number;
    state?: string;
    stateRate?: number;
    netWorth?: number;
    existingInsurance?: number;
    mortgage?: number;
    otherDebt?: number;
    monthlySav?: number;
    existingSavings?: number;
    isSelfEmployed?: boolean;
    filing?: "single" | "mfj";
    retirement401k?: number;
    hsaContrib?: number;
    charitableGiving?: number;
    housing?: number;
    transport?: number;
    food?: number;
    insurance?: number;
    other?: number;
  };
  goals?: {
    retireAge?: number;
    ss62?: number;
    ss67?: number;
    ss70?: number;
    pension?: number;
    withdrawalRate?: number;
    educationGoalUsd?: number;
    educationKids?: number;
    educationAvgAge?: number;
    educationCurrentBal?: number;
    educationMonthly?: number;
    estateGoalUsd?: number;
    estateExemption?: number;
    legacyGoalUsd?: number;
    growthRate?: number;
    inflationRate?: number;
    taxAdvantagedReturn?: number;
    iulReturn?: number;
    fiaReturn?: number;
  };
  protectionGap?: number;
  riskTolerance?: "conservative" | "moderate" | "aggressive";
}

type CoreModule = typeof core;
type LooseFn = (...args: unknown[]) => unknown;

function call(fn: LooseFn | undefined, ...args: unknown[]): unknown {
  return fn ? fn(...args) : undefined;
}

export async function generateWealthPlan(
  ctx: EngineContext,
  intent: Intent<unknown>,
): Promise<IntentResult> {
  const input = intent.payload as Partial<WealthPlanInput>;
  if (!input?.household) {
    return {
      ok: false,
      error: { code: "BAD_PAYLOAD", message: "missional.wealth.plan requires { household, goals?, protectionGap?, riskTolerance? }" },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }

  const h = input.household;
  const g = input.goals ?? {};
  // Cast through unknown so TS lets us pass positional args to the legacy core.
  const c = core as unknown as Record<string, LooseFn>;

  try {
    const cashFlow = call(c.calcCashFlow, h.grossIncome, 0.25, h.housing ?? 0, h.transport ?? 0, h.food ?? 0, h.insurance ?? 0, h.other ?? 0);
    const protection = call(c.calcProtection, h.grossIncome, h.deps ?? 0, h.mortgage ?? 0, h.otherDebt ?? 0, h.existingInsurance ?? 0, h.netWorth ?? 0);
    const growth = call(
      c.calcGrowth,
      h.age,
      g.retireAge ?? 65,
      h.monthlySav ?? 0,
      h.existingSavings ?? 0,
      g.inflationRate ?? 0.025,
      g.taxAdvantagedReturn ?? 0.07,
      g.iulReturn ?? 0.06,
      g.fiaReturn ?? 0.045,
    );
    const retirement = call(
      c.calcRetirement,
      h.age,
      g.retireAge ?? 65,
      g.ss62 ?? 0,
      g.ss67 ?? 0,
      g.ss70 ?? 0,
      g.pension ?? 0,
      g.withdrawalRate ?? 0.04,
      h.existingSavings ?? 0,
      h.monthlySav ?? 0,
    );
    const tax = call(
      c.calcTax,
      h.grossIncome,
      h.stateRate ?? 0.05,
      Boolean(h.isSelfEmployed),
      h.filing ?? "mfj",
      h.retirement401k ?? 0,
      h.hsaContrib ?? 0,
      h.charitableGiving ?? 0,
    );
    const estate = call(
      c.calcEstate,
      (h.netWorth ?? 0) + (h.existingInsurance ?? 0),
      g.estateExemption ?? 13_610_000,
      g.growthRate ?? 0.05,
      0,
      "unknown",
    );
    const education = g.educationGoalUsd
      ? call(
          c.calcEducation,
          g.educationKids ?? (h.deps ?? 0),
          g.educationAvgAge ?? 8,
          g.educationGoalUsd,
          g.inflationRate ?? 0.025,
          g.taxAdvantagedReturn ?? 0.06,
          g.educationCurrentBal ?? 0,
          g.educationMonthly ?? 0,
        )
      : null;

    // Scorecard + recommendations expect positional signatures too.
    const scorecard = call(
      c.computeScorecard,
      cashFlow,
      protection,
      growth,
      retirement,
      tax,
      estate,
      education,
    );
    const recommendations = call(
      c.buildRecommendations,
      h.age,
      h.grossIncome,
      h.deps ?? 0,
      h.netWorth ?? 0,
      h.existingInsurance ?? 0,
      h.mortgage ?? 0,
      h.otherDebt ?? 0,
      Boolean(h.isSelfEmployed),
      (scorecard ?? {}) as Record<string, number>,
    );
    const horizon = call(c.buildHorizonData, h.age, g.retireAge ?? 65);
    const actionPlan = call(c.buildActionPlan, recommendations);

    const plan = { cashFlow, protection, growth, retirement, tax, estate, education, scorecard, recommendations, horizon, actionPlan };

    // Generate a costed proposal for practitioner review.
    const proposal = await ctx.substrate.dispatch({
      kind: "missional.wealth.plan.proposal",
      expects: ["proposal-generator"],
      payload: { plan, adminLevel: ctx.meta.adminLevel },
      meta: { ...ctx.meta, originEngine: "missional" },
    });

    return {
      ok: true,
      data: { plan, proposalId: (proposal.data as { proposalId?: string } | undefined)?.proposalId } as never,
      invoked: ["proposal-generator"],
      cost: proposal.cost,
      qualityScore: 0.95,
      auditId: ctx.meta.correlationId,
    };
  } catch (e) {
    const err = e as Error;
    ctx.log("error", "missional.wealth.plan failure", { message: err.message });
    return {
      ok: false,
      error: { code: "PLAN_FAILED", message: err.message },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }
}

// Re-export core module for tests that introspect signatures.
export type { CoreModule };
