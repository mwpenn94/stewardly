/**
 * Regression test: snapTrade + financialData routers are wired into appRouter
 * and contain no mock/MOCK fallback paths.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { appRouter } from "./routers";

function readSrc(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), "utf-8");
}

describe("Financial integration routers — registration", () => {
  it("appRouter exposes snapTrade and financialData", () => {
    const def = (appRouter as any)._def;
    const procedures = def.procedures ?? def.record ?? {};
    // tRPC v11 stores nested routers as `someRouter._def.record` keys flattened
    const allKeys = Object.keys(procedures).concat(Object.keys(def.record ?? {}));
    expect(allKeys.some(k => k.startsWith("snapTrade"))).toBe(true);
    expect(allKeys.some(k => k.startsWith("financialData"))).toBe(true);
  });

  it("snapTrade router file exists and exports snapTradeRouter", () => {
    const src = readSrc("server/routers/snapTrade.ts");
    expect(src).toContain("export const snapTradeRouter");
    expect(src).toContain("snapTradeService");
  });

  it("financialData router file exists and exports financialDataRouter", () => {
    const src = readSrc("server/routers/financialData.ts");
    expect(src).toContain("export const financialDataRouter");
  });
});

describe("Financial integration routers — live-only (no mock fallback)", () => {
  it("snapTrade router has no mock/stub fallback", () => {
    const src = readSrc("server/routers/snapTrade.ts");
    expect(/\bmock\b/i.test(src)).toBe(false);
    expect(src).not.toMatch(/return\s+\{[^}]*fake/i);
  });

  it("financialData router has no mock/stub fallback", () => {
    const src = readSrc("server/routers/financialData.ts");
    expect(/\bmock\b/i.test(src)).toBe(false);
  });

  it("snapTradeService throws when platform credentials missing", () => {
    const src = readSrc("server/services/snapTradeService.ts");
    // The service must surface a clear error rather than silently returning fake data.
    expect(src).toMatch(/SnapTrade platform credentials not configured/);
  });

  it("financialData adapters throw when API key missing", () => {
    const src = readSrc("server/routers/financialData.ts");
    expect(src).toMatch(/FRED_API_KEY is not configured/);
    expect(src).toMatch(/BEA_API_KEY is not configured/);
    expect(src).toMatch(/BLS_API_KEY is not configured/);
    expect(src).toMatch(/CENSUS_API_KEY is not configured/);
  });
});

describe("Financial integration routers — schema usage", () => {
  it("snapTradeService references real schema tables (no in-memory store)", () => {
    const src = readSrc("server/services/snapTradeService.ts");
    expect(src).toContain("snapTradeUsers");
    expect(src).toContain("snapTradeBrokerageConnections");
    expect(src).toContain("snapTradeAccounts");
    expect(src).toContain("snapTradePositions");
    // Must not use ad-hoc Map/Set as a primary data store
    expect(src).not.toMatch(/new\s+Map<[^>]*>\(\)\s*;\s*\/\/\s*store/i);
  });
});
