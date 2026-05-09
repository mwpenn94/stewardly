/**
 * Wealth-engine tool registry tests.
 *
 * Verifies:
 *   1. All 18 expected tools are registered
 *   2. Per-layer access matrix is correct (L5 sees only UWE; L4 + BIE; L3+L2 + HE; L1 sees SCUI too)
 *   3. invokeWealthTool throws FORBIDDEN-shaped errors for under-privileged callers
 *   4. invokeWealthTool actually dispatches a working tool end-to-end
 */
import { describe, it, expect } from "vitest";
import {
  WEALTH_ENGINE_TOOLS,
  toolsForLayer,
  invokeWealthTool,
  findWealthTool,
} from "./engines/missional/wealth/agentTools";

describe("wealth-engine tool registry", () => {
  it("registers exactly the 18 canonical tools", () => {
    const names = WEALTH_ENGINE_TOOLS.map((t) => t.tool.function.name).sort();
    expect(names).toEqual(
      [
        // UWE
        "uwe_simulate", "uwe_monte_carlo", "uwe_estimate_premium",
        // BIE
        "bie_simulate", "bie_back_plan", "bie_roll_up", "bie_economics",
        // HE
        "he_simulate", "he_compare", "he_milestones", "he_back_plan",
        // SCUI
        "historical_backtest", "stress_test", "check_guardrails",
        "get_product_references", "get_industry_benchmarks", "get_methodology",
      ].sort(),
    );
  });

  it("each tool advertises a valid OpenAI function shape", () => {
    for (const t of WEALTH_ENGINE_TOOLS) {
      expect(t.tool.type).toBe("function");
      expect(typeof t.tool.function.name).toBe("string");
      expect(typeof t.tool.function.description).toBe("string");
      expect(t.tool.function.parameters).toBeDefined();
      expect(["uwe", "bie", "he", "scui"]).toContain(t.family);
      expect(["L1", "L2", "L3", "L4", "L5"]).toContain(t.requiredLayer);
      expect(typeof t.executor).toBe("function");
    }
  });

  it("L5 user sees only UWE tools", () => {
    const allowed = toolsForLayer("L5").map((t) => t.tool.function.name);
    expect(allowed).toEqual(["uwe_simulate", "uwe_monte_carlo", "uwe_estimate_premium"]);
  });

  it("L4 professional sees UWE + BIE", () => {
    const allowed = toolsForLayer("L4").map((t) => t.tool.function.name);
    const families = new Set(toolsForLayer("L4").map((t) => t.family));
    expect(families).toEqual(new Set(["uwe", "bie"]));
    expect(allowed.length).toBe(7);
  });

  it("L3 manager sees UWE + BIE + HE (no SCUI)", () => {
    const families = new Set(toolsForLayer("L3").map((t) => t.family));
    expect(families).toEqual(new Set(["uwe", "bie", "he"]));
    expect(toolsForLayer("L3").length).toBe(11);
  });

  it("L2 org_admin sees same surface as L3 (UWE+BIE+HE, no SCUI)", () => {
    const l2 = toolsForLayer("L2").map((t) => t.tool.function.name).sort();
    const l3 = toolsForLayer("L3").map((t) => t.tool.function.name).sort();
    expect(l2).toEqual(l3);
  });

  it("L1 global_admin sees all 18 tools", () => {
    expect(toolsForLayer("L1").length).toBe(WEALTH_ENGINE_TOOLS.length);
  });

  it("invokeWealthTool denies under-privileged caller", async () => {
    // L5 cannot call SCUI's check_guardrails
    await expect(
      invokeWealthTool("check_guardrails", { params: { withdrawalRate: 0.04 } }, "L5"),
    ).rejects.toThrow(/requires layer L1/);
  });

  it("invokeWealthTool throws on unknown tool name", async () => {
    await expect(invokeWealthTool("nonexistent_tool", {}, "L1"))
      .rejects.toThrow(/unknown wealth tool/);
  });

  it("invokeWealthTool dispatches uwe_estimate_premium end-to-end", async () => {
    const result = await invokeWealthTool(
      "uwe_estimate_premium",
      { productType: "term", age: 35, amount: 500000 },
      "L5",
    );
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThan(0);
  });

  it("invokeWealthTool dispatches check_guardrails for L1", async () => {
    const result = await invokeWealthTool(
      "check_guardrails",
      { params: { assumedReturn: 0.20, withdrawalRate: 0.10 } },
      "L1",
    );
    expect(Array.isArray(result)).toBe(true);
  });

  it("findWealthTool returns null for missing names", () => {
    expect(findWealthTool("totally_made_up")).toBeNull();
    expect(findWealthTool("uwe_simulate")).not.toBeNull();
  });
});
