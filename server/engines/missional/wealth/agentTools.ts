/**
 * Wealth-engine agent tool registry — exposes UWE / BIE / HE / SCUI as
 * OpenAI-style tool definitions plus matching executors. Each tool carries a
 * `requiredLayer` so the registry can be filtered per caller's role.
 *
 * Per-layer access map (per the task plan):
 *   L5 user            → UWE only
 *   L4 professional    → UWE + BIE
 *   L3 manager         → UWE + BIE + HE
 *   L2 org_admin       → UWE + BIE + HE
 *   L1 global_admin    → all (UWE + BIE + HE + SCUI)
 *
 * Tools accept JSON arguments produced by the LLM, deserialise with light
 * permissive guards, dispatch into the engine modules, and return the raw
 * engine result. The chat agent serialises the result with JSON.stringify in
 * its tool-result message; downstream procedures may shape it differently.
 */

import { UWE } from "./wealth-engines-legacy/uwe";
import { BIE } from "./wealth-engines-legacy/bie";
import type { RoleKey, FrequencyKey } from "./wealth-engines-legacy/types";
import { HE } from "./wealth-engines-legacy/he";
import { SCUI } from "./wealth-engines-legacy/scui";
import type { Tool } from "../../../_core/llm";

/**
 * Engine layer required for a caller to execute the tool. Higher layers
 * subsume lower layers; the registry picks the lowest-tier qualifying layer.
 */
export type EngineLayer = "L5" | "L4" | "L3" | "L2" | "L1";

const LAYER_RANK: Record<EngineLayer, number> = { L5: 1, L4: 2, L3: 3, L2: 4, L1: 5 };

export interface WealthToolDef {
  /** OpenAI function-calling tool definition */
  tool: Tool;
  /** Lowest layer that can invoke this tool */
  requiredLayer: EngineLayer;
  /** Engine family ("uwe" | "bie" | "he" | "scui") for grouping in UIs */
  family: "uwe" | "bie" | "he" | "scui";
  /** Synchronous or async executor; arguments are validated by the executor itself */
  executor: (args: Record<string, unknown>) => unknown | Promise<unknown>;
}

// ── helpers ────────────────────────────────────────────────────────────────
function asNum(v: unknown, dflt = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return dflt;
}
function asString(v: unknown, dflt = ""): string {
  return typeof v === "string" ? v : dflt;
}
function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

// ── UWE tools ───────────────────────────────────────────────────────────────
const uweSimulate: WealthToolDef = {
  family: "uwe",
  requiredLayer: "L5",
  tool: {
    type: "function",
    function: {
      name: "uwe_simulate",
      description: "Universal Wealth Engine — simulate a multi-product wealth strategy over a horizon.",
      parameters: {
        type: "object",
        properties: {
          companyKey: { type: "string", description: "Company configuration key" },
          profile: { type: "object", description: "Client profile (age, income, etc.)" },
          customProducts: { type: ["array", "null"], description: "Optional override product configs" },
          years: { type: "number", description: "Simulation horizon in years (default 30)" },
        },
        required: ["companyKey", "profile"],
        additionalProperties: false,
      },
    },
  },
  executor: (args) => {
    const companyKey = asString(args.companyKey) as keyof typeof UWE.COMPANIES;
    const profile = asObj(args.profile);
    const customProducts = Array.isArray(args.customProducts) ? (args.customProducts as Parameters<typeof UWE.buildStrategy>[2]) : null;
    const years = asNum(args.years, 30);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strategy = UWE.buildStrategy(companyKey, profile as any, customProducts);
    return UWE.simulate(strategy, years);
  },
};

const uweMonteCarlo: WealthToolDef = {
  family: "uwe",
  requiredLayer: "L5",
  tool: {
    type: "function",
    function: {
      name: "uwe_monte_carlo",
      description: "Universal Wealth Engine — Monte Carlo distribution of strategy outcomes.",
      parameters: {
        type: "object",
        properties: {
          companyKey: { type: "string" },
          profile: { type: "object" },
          customProducts: { type: ["array", "null"] },
          years: { type: "number" },
          runs: { type: "number", description: "Number of MC iterations (default 1000)" },
        },
        required: ["companyKey", "profile"],
        additionalProperties: false,
      },
    },
  },
  executor: (args) => {
    const companyKey = asString(args.companyKey) as keyof typeof UWE.COMPANIES;
    const profile = asObj(args.profile);
    const customProducts = Array.isArray(args.customProducts) ? (args.customProducts as Parameters<typeof UWE.buildStrategy>[2]) : null;
    const years = asNum(args.years, 30);
    const runs = asNum(args.runs, 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strategy = UWE.buildStrategy(companyKey, profile as any, customProducts);
    return UWE.monteCarlo(strategy, years, runs);
  },
};

const uweEstimatePremium: WealthToolDef = {
  family: "uwe",
  requiredLayer: "L5",
  tool: {
    type: "function",
    function: {
      name: "uwe_estimate_premium",
      description: "Estimate premium for an insurance product given product type, age, and amount.",
      parameters: {
        type: "object",
        properties: {
          productType: { type: "string", description: "Product type key (e.g. \"term\", \"whole_life\", \"univ_life\")" },
          age: { type: "number" },
          amount: { type: "number" },
        },
        required: ["productType", "age", "amount"],
        additionalProperties: false,
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor: (args) => UWE.estPrem(asString(args.productType) as any, asNum(args.age), asNum(args.amount)),
};

// ── BIE tools ───────────────────────────────────────────────────────────────
const bieSimulate: WealthToolDef = {
  family: "bie",
  requiredLayer: "L4",
  tool: {
    type: "function",
    function: {
      name: "bie_simulate",
      description: "Business Income Engine — simulate revenue stream over a horizon.",
      parameters: {
        type: "object",
        properties: {
          strategy: { type: "object" },
          years: { type: "number" },
        },
        required: ["strategy"],
        additionalProperties: false,
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor: (args) => BIE.simulate(asObj(args.strategy) as any, asNum(args.years, 30)),
};

const bieBackPlan: WealthToolDef = {
  family: "bie",
  requiredLayer: "L4",
  tool: {
    type: "function",
    function: {
      name: "bie_back_plan",
      description: "BIE — back-plan from a target income to required GDC and channel mix.",
      parameters: {
        type: "object",
        properties: {
          targetIncome: { type: "number" },
          role: { type: "string", description: "Role key (default \"new\")" },
        },
        required: ["targetIncome"],
        additionalProperties: false,
      },
    },
  },
  executor: (args) => BIE.backPlan(asNum(args.targetIncome), (asString(args.role, "new") as RoleKey)),
};

const bieRollUp: WealthToolDef = {
  family: "bie",
  requiredLayer: "L4",
  tool: {
    type: "function",
    function: {
      name: "bie_roll_up",
      description: "BIE — roll up multiple BIE strategies into a single multi-stream summary.",
      parameters: {
        type: "object",
        properties: {
          strategies: { type: "array" },
          year: { type: "number" },
        },
        required: ["strategies"],
        additionalProperties: false,
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor: (args) => BIE.rollUp(asArr(args.strategies) as any[], asNum(args.year, 1)),
};

const bieEconomics: WealthToolDef = {
  family: "bie",
  requiredLayer: "L4",
  tool: {
    type: "function",
    function: {
      name: "bie_economics",
      description: "BIE — calculate strategy economics (gross/net/effective rates) over horizon.",
      parameters: {
        type: "object",
        properties: {
          strategy: { type: "object" },
          years: { type: "number" },
        },
        required: ["strategy"],
        additionalProperties: false,
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor: (args) => BIE.calcEconomics(asObj(args.strategy) as any, asNum(args.years, 5)),
};

// Convenience tool: convert annual to FrequencyKey amount (used internally by chat)
export const bieFrequencyHelper = (annual: number, freq: FrequencyKey) => BIE.toFrequency(annual, freq);

// ── HE tools ────────────────────────────────────────────────────────────────
const heSimulate: WealthToolDef = {
  family: "he",
  requiredLayer: "L3",
  tool: {
    type: "function",
    function: {
      name: "he_simulate",
      description: "Holistic Engine — simulate a holistic strategy combining wealth + business income.",
      parameters: {
        type: "object",
        properties: {
          strategy: { type: "object" },
          years: { type: "number" },
        },
        required: ["strategy"],
        additionalProperties: false,
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor: (args) => HE.simulate(asObj(args.strategy) as any, asNum(args.years, 30)),
};

const heCompare: WealthToolDef = {
  family: "he",
  requiredLayer: "L3",
  tool: {
    type: "function",
    function: {
      name: "he_compare",
      description: "Holistic Engine — compare two or more holistic strategies side-by-side.",
      parameters: {
        type: "object",
        properties: {
          strategies: { type: "array" },
          years: { type: "number" },
        },
        required: ["strategies"],
        additionalProperties: false,
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executor: (args) => HE.compareStrategies(asArr(args.strategies) as any[], asNum(args.years, 30)),
};

const heMilestones: WealthToolDef = {
  family: "he",
  requiredLayer: "L3",
  tool: {
    type: "function",
    function: {
      name: "he_milestones",
      description: "Holistic Engine — compare strategies at specific milestone years.",
      parameters: {
        type: "object",
        properties: {
          strategies: { type: "array" },
          milestones: { type: "array", items: { type: "number" } },
        },
        required: ["strategies", "milestones"],
        additionalProperties: false,
      },
    },
  },
  executor: (args) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    HE.milestoneCompare(asArr(args.strategies) as any[], (asArr(args.milestones) as number[])),
};

const heBackPlan: WealthToolDef = {
  family: "he",
  requiredLayer: "L3",
  tool: {
    type: "function",
    function: {
      name: "he_back_plan",
      description: "Holistic Engine — back-plan required income to reach a target wealth at a target year.",
      parameters: {
        type: "object",
        properties: {
          targetValue: { type: "number", description: "Target net worth at the horizon" },
          targetYear: { type: "number", description: "Number of years to reach the target" },
          baseStrategy: { type: "object", description: "Base HolisticStrategyConfig" },
        },
        required: ["targetValue", "targetYear", "baseStrategy"],
        additionalProperties: false,
      },
    },
  },
  executor: (args) =>
    HE.backPlanHolistic(
      asNum(args.targetValue),
      asNum(args.targetYear, 30),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      asObj(args.baseStrategy) as any,
    ),
};

// ── SCUI tools ──────────────────────────────────────────────────────────────
const scuiHistoricalBacktest: WealthToolDef = {
  family: "scui",
  requiredLayer: "L1",
  tool: {
    type: "function",
    function: {
      name: "historical_backtest",
      description: "Strategic Confidence & Underwriting Insights — historical backtest against S&P 500.",
      parameters: {
        type: "object",
        properties: {
          startBalance: { type: "number" },
          annualContribution: { type: "number" },
          annualCost: { type: "number" },
          horizon: { type: "number" },
        },
        required: ["startBalance", "horizon"],
        additionalProperties: false,
      },
    },
  },
  executor: (args) =>
    SCUI.historicalBacktest(
      asNum(args.startBalance, 0),
      asNum(args.annualContribution, 0),
      asNum(args.annualCost, 0),
      asNum(args.horizon, 30),
    ),
};

const scuiStressTest: WealthToolDef = {
  family: "scui",
  requiredLayer: "L1",
  tool: {
    type: "function",
    function: {
      name: "stress_test",
      description: "SCUI — stress test a balance under a named market scenario.",
      parameters: {
        type: "object",
        properties: {
          scenarioKey: { type: "string" },
          startBalance: { type: "number" },
          annualContribution: { type: "number" },
          annualCost: { type: "number" },
        },
        required: ["scenarioKey", "startBalance"],
        additionalProperties: false,
      },
    },
  },
  executor: (args) =>
    SCUI.stressTest(
      asString(args.scenarioKey),
      asNum(args.startBalance, 0),
      asNum(args.annualContribution, 0),
      asNum(args.annualCost, 0),
    ),
};

const scuiCheckGuardrails: WealthToolDef = {
  family: "scui",
  requiredLayer: "L1",
  tool: {
    type: "function",
    function: {
      name: "check_guardrails",
      description: "SCUI — check parameter guardrails (assumed return / withdrawal rate / etc.).",
      parameters: {
        type: "object",
        properties: { params: { type: "object" } },
        required: ["params"],
        additionalProperties: false,
      },
    },
  },
  executor: (args) => SCUI.checkGuardrails(asObj(args.params) as Record<string, number>),
};

const scuiGetProductReferences: WealthToolDef = {
  family: "scui",
  requiredLayer: "L1",
  tool: {
    type: "function",
    function: {
      name: "get_product_references",
      description: "SCUI — return the catalog of product references.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  executor: () => SCUI.PRODUCT_REFERENCES,
};

const scuiGetIndustryBenchmarks: WealthToolDef = {
  family: "scui",
  requiredLayer: "L1",
  tool: {
    type: "function",
    function: {
      name: "get_industry_benchmarks",
      description: "SCUI — return the catalog of industry benchmarks.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  executor: () => SCUI.INDUSTRY_BENCHMARKS,
};

const scuiGetMethodology: WealthToolDef = {
  family: "scui",
  requiredLayer: "L1",
  tool: {
    type: "function",
    function: {
      name: "get_methodology",
      description: "SCUI — return the platform's methodology disclosure.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  executor: () => SCUI.METHODOLOGY_DISCLOSURE,
};

// ── Registry ────────────────────────────────────────────────────────────────
export const WEALTH_ENGINE_TOOLS: WealthToolDef[] = [
  uweSimulate, uweMonteCarlo, uweEstimatePremium,
  bieSimulate, bieBackPlan, bieRollUp, bieEconomics,
  heSimulate, heCompare, heMilestones, heBackPlan,
  scuiHistoricalBacktest, scuiStressTest, scuiCheckGuardrails,
  scuiGetProductReferences, scuiGetIndustryBenchmarks, scuiGetMethodology,
];

/**
 * Map from caller's effective layer to the lowest layer rank they qualify
 * for. Returns 0 for "no access."
 */
export function callerLayerRank(layer: EngineLayer | null | undefined): number {
  if (!layer) return 0;
  return LAYER_RANK[layer];
}

/** Tools the caller is allowed to see / invoke at this layer. */
export function toolsForLayer(layer: EngineLayer): WealthToolDef[] {
  const rank = LAYER_RANK[layer];
  // Per task plan: L4 sees UWE+BIE, L3 adds HE, L2 same as L3, L1 adds SCUI.
  const maxAllowed: Record<EngineLayer, number> = { L5: 1, L4: 2, L3: 3, L2: 3, L1: 5 };
  const cap = maxAllowed[layer];
  return WEALTH_ENGINE_TOOLS.filter(t => LAYER_RANK[t.requiredLayer] <= cap && LAYER_RANK[t.requiredLayer] <= rank + 4);
}

/** Find a tool by name. */
export function findWealthTool(name: string): WealthToolDef | null {
  return WEALTH_ENGINE_TOOLS.find(t => t.tool.function.name === name) ?? null;
}

/**
 * Authoritative dispatch: validates layer access, then runs the executor.
 * Throws when the tool doesn't exist or the caller's layer is too low.
 */
export async function invokeWealthTool(
  name: string,
  args: Record<string, unknown>,
  callerLayer: EngineLayer,
): Promise<unknown> {
  const tool = findWealthTool(name);
  if (!tool) throw new Error(`unknown wealth tool: ${name}`);
  const allowed = toolsForLayer(callerLayer).some(t => t.tool.function.name === name);
  if (!allowed) {
    throw new Error(
      `tool ${name} requires layer ${tool.requiredLayer}, caller has ${callerLayer}`,
    );
  }
  return await tool.executor(args);
}
