/**
 * Wave B-4 + B-6 — Continuous-Improvement self-application + round-trip
 * =======================================================================
 *
 * Pins:
 *   COV-1: every engine's ontological enumeration is non-empty
 *   COV-2: 5 canonical engines are represented
 *   COV-3: computeEngineCoverage returns 100% when operational == ontological
 *   COV-4: missing intents are surfaced
 *   COV-5: platform overall is the weighted-by-intent-count percentage
 *   COV-6: CI engine handler returns a coverage snapshot for `coverage.snapshot` intent
 *   COV-7: CI handler refuses an unknown intent
 *
 *   RT-1: empty buffer reports zeros
 *   RT-2: a single observation reports a sample with correct latency
 *   RT-3: many observations report sensible p50/p95
 *   RT-4: failed observations decrement success rate but still count
 *   RT-5: buffer caps at capacity (oldest evicted)
 *   RT-6: CI engine handler returns the round-trip report for `roundtrip.report`
 *   RT-7: CI engine handler accepts a `roundtrip.observe` payload
 *   RT-8: CI handler rejects malformed `roundtrip.observe` payload
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  ONTOLOGICAL_INTENTS,
  computeEngineCoverage,
  computePlatformCoverage,
  DEFAULT_OPERATIONAL_BASELINE,
  type EngineId,
} from "../continuous-improvement/coverage";
import {
  observeRoundTrip,
  getRoundTripReport,
  __resetRoundTripBufferForTests,
} from "../continuous-improvement/roundTrip";
import { continuousImprovementHandler } from "../continuous-improvement";
import type { Intent, EngineContext, SubstratePort } from "../_intent";

function makeCtx(): EngineContext {
  const noopSubstrate: SubstratePort = {
    dispatch: async () => ({
      ok: true,
      data: undefined,
      invoked: [],
      cost: { apiUsd: 0, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
      auditId: "test-correlation-id",
    }),
  };
  return {
    log: () => {},
    substrate: noopSubstrate,
    meta: { correlationId: "test-correlation-id", tenantId: "t-test", actorId: "u-test", layer: "Professional" },
  };
}

function makeIntent(kind: string, payload: unknown = {}): Intent {
  return { kind, expects: [], payload, meta: { correlationId: "c", tenantId: "t", actorId: "a", layer: "Professional" } };
}

describe("Wave B-4 — coverage", () => {
  it("COV-1: every engine has at least one ontological intent", () => {
    for (const ids of Object.values(ONTOLOGICAL_INTENTS)) {
      expect(ids.length).toBeGreaterThan(0);
    }
  });
  it("COV-2: exactly 5 canonical engines", () => {
    expect(Object.keys(ONTOLOGICAL_INTENTS).sort()).toEqual([
      "contextual",
      "continuous-improvement",
      "formational",
      "missional",
      "relational",
    ]);
  });
  it("COV-3: 100% operationalPercent when operational == ontological", () => {
    const r = computeEngineCoverage("formational", { operationalByEngine: DEFAULT_OPERATIONAL_BASELINE });
    expect(r.operationalPercent).toBe(100);
    expect(r.missingIntents).toHaveLength(0);
  });
  it("COV-4: missing intents are surfaced when operational is partial", () => {
    const partial = { ...DEFAULT_OPERATIONAL_BASELINE, formational: ["formational.skill.assess"] as readonly string[] };
    const r = computeEngineCoverage("formational", { operationalByEngine: partial });
    expect(r.operationalPercent).toBeLessThan(100);
    expect(r.missingIntents.length).toBeGreaterThan(0);
    expect(r.operationalIntents).toContain("formational.skill.assess");
  });
  it("COV-5: platform overall percent is weighted by total intent count", () => {
    // Make formational 50% covered; everything else 100%.
    const ont = ONTOLOGICAL_INTENTS.formational;
    const halfFormational: readonly string[] = ont.slice(0, Math.floor(ont.length / 2));
    const partial: Record<EngineId, readonly string[]> = {
      ...DEFAULT_OPERATIONAL_BASELINE,
      formational: halfFormational,
    };
    const r = computePlatformCoverage({ operationalByEngine: partial });
    expect(r.overallPercent).toBeLessThan(100);
    expect(r.overallPercent).toBeGreaterThan(80); // formational is one of five engines
  });
  it("COV-6: CI handler returns a coverage snapshot for coverage.snapshot", async () => {
    const result = await continuousImprovementHandler(makeCtx(), makeIntent("continuous-improvement.coverage.snapshot"));
    expect(result.ok).toBe(true);
    const data = result.data as { engines: unknown[]; overallPercent: number };
    expect(Array.isArray(data.engines)).toBe(true);
    expect(data.engines).toHaveLength(5);
    expect(data.overallPercent).toBeGreaterThanOrEqual(0);
    expect(data.overallPercent).toBeLessThanOrEqual(100);
  });
  it("COV-7: CI handler refuses an unknown intent", async () => {
    const result = await continuousImprovementHandler(makeCtx(), makeIntent("continuous-improvement.fictional"));
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("UNKNOWN_INTENT");
  });
});

describe("Wave B-6 — round-trip metrics", () => {
  beforeEach(() => __resetRoundTripBufferForTests());

  it("RT-1: empty buffer reports zeros", () => {
    const r = getRoundTripReport();
    expect(r.sampleCount).toBe(0);
    expect(r.successRate).toBe(0);
    expect(r.p50LatencyMs).toBe(0);
    expect(r.p95LatencyMs).toBe(0);
  });
  it("RT-2: single successful observation reports correct latency and 100% success", () => {
    observeRoundTrip({ taskId: 1, hubItemId: 10, startedAt: 1000, completedAt: 1100, success: true });
    const r = getRoundTripReport();
    expect(r.sampleCount).toBe(1);
    expect(r.successRate).toBe(1);
    expect(r.p50LatencyMs).toBe(100);
    expect(r.p95LatencyMs).toBe(100);
    expect(r.lastObservationAt).toBe(1100);
  });
  it("RT-3: many observations report sensible p50/p95", () => {
    for (let i = 0; i < 100; i++) {
      observeRoundTrip({ taskId: i, hubItemId: i + 1000, startedAt: 0, completedAt: i, success: true });
    }
    const r = getRoundTripReport();
    expect(r.sampleCount).toBe(100);
    expect(r.p50LatencyMs).toBeGreaterThanOrEqual(49);
    expect(r.p50LatencyMs).toBeLessThanOrEqual(50);
    expect(r.p95LatencyMs).toBeGreaterThanOrEqual(94);
    expect(r.p95LatencyMs).toBeLessThanOrEqual(95);
  });
  it("RT-4: failed observations decrement success rate but still count", () => {
    observeRoundTrip({ taskId: 1, hubItemId: 10, startedAt: 0, completedAt: 50, success: true });
    observeRoundTrip({ taskId: 2, hubItemId: 11, startedAt: 0, completedAt: 80, success: false });
    const r = getRoundTripReport();
    expect(r.sampleCount).toBe(2);
    expect(r.successRate).toBe(0.5);
  });
  it("RT-5: buffer caps at capacity (oldest evicted)", () => {
    // Fill beyond capacity (1000) so the first inserted gets evicted.
    for (let i = 0; i < 1100; i++) {
      observeRoundTrip({ taskId: i, hubItemId: i, startedAt: 0, completedAt: i, success: true });
    }
    const r = getRoundTripReport();
    expect(r.sampleCount).toBe(1000);
    // Last observation seen has the highest completedAt (i = 1099).
    expect(r.lastObservationAt).toBe(1099);
  });
  it("RT-6: CI handler returns the round-trip report for roundtrip.report", async () => {
    observeRoundTrip({ taskId: 1, hubItemId: 10, startedAt: 0, completedAt: 100, success: true });
    const result = await continuousImprovementHandler(makeCtx(), makeIntent("continuous-improvement.roundtrip.report"));
    expect(result.ok).toBe(true);
    const data = result.data as { sampleCount: number };
    expect(data.sampleCount).toBe(1);
  });
  it("RT-7: CI handler accepts a roundtrip.observe payload", async () => {
    const payload = { taskId: 5, hubItemId: 50, startedAt: 0, completedAt: 75, success: true };
    const result = await continuousImprovementHandler(makeCtx(), makeIntent("continuous-improvement.roundtrip.observe", payload));
    expect(result.ok).toBe(true);
    expect((result.data as { observationId: number }).observationId).toBeGreaterThanOrEqual(0);
    expect(getRoundTripReport().sampleCount).toBe(1);
  });
  it("RT-8: CI handler rejects malformed roundtrip.observe payload", async () => {
    const result = await continuousImprovementHandler(
      makeCtx(),
      // Intent missing payload field entirely
      { kind: "continuous-improvement.roundtrip.observe", expects: [], payload: null as unknown as object, meta: { correlationId: "c", tenantId: "t", actorId: "a", layer: "Professional" } },
    );
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("BAD_PAYLOAD");
  });
});
