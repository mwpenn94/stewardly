/**
 * Wave B-1 — Conflict-of-Interest invariant
 * ===========================================
 *
 * Commitment C-10 / C-11: "0% markup is preserved across all SubstrateRouter
 * dispatches." Every substrate-routed intent that produces a provider
 * DirectCost component must pass through that DirectCost at exactly 0%
 * markup, regardless of:
 *
 *   - tenant
 *   - path (internal-bundled / byo)
 *   - intent shape (any combination of the six measurable cost categories)
 *   - measured-savings outcome
 *   - protection-ceiling activation
 *
 * If a future code change ever introduces a markup on the provider's
 * passthrough — even a fractional cent — this test fails loud.
 *
 * The check uses property-style enumeration across a wide grid of inputs
 * and a deliberate-violation negative test that confirms the assertion
 * actually catches a hand-constructed bad value.
 */

import { describe, it, expect } from "vitest";
import { computePricingLine, type ConsumptionPath } from "../index";
import { passthroughDirectCost } from "../directCost";
import {
  assertZeroMarkupOnDirectCost,
  NonCompetitionViolationError,
} from "../nonCompetition";
import type { IntentCost } from "../../engines/_intent";

const PATHS: ConsumptionPath[] = ["internal-bundled", "byo"];

const TENANTS = ["t-default", "t-acme", "t-orion-stewardship", "t-anonymous"];

const SAVINGS = [-1000, 0, 0.01, 50, 5_000, 5_000_000];

// 18 representative intent cost shapes covering: zero-cost (idle),
// API-only, bandwidth-heavy, storage-heavy, hardware-heavy,
// electricity-only, per-seat-only, mixed, and stress upper-bounds.
const COSTS: IntentCost[] = [
  { apiUsd: 0, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 0.0001, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 0.05, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 0.50, bandwidthUsd: 0.10, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 1.00, bandwidthUsd: 0, storageUsd: 0.20, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 2.50, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0.30, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 0, bandwidthUsd: 0.40, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 0, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0.05, perSeatDisplacedUsd: 0 },
  { apiUsd: 0, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 250 },
  { apiUsd: 0.75, bandwidthUsd: 0.05, storageUsd: 0.10, hardwareUsd: 0.15, electricityUsd: 0.02, perSeatDisplacedUsd: 0 },
  { apiUsd: 5.00, bandwidthUsd: 1.00, storageUsd: 1.00, hardwareUsd: 1.00, electricityUsd: 0.50, perSeatDisplacedUsd: 0 },
  { apiUsd: 12.34, bandwidthUsd: 2.34, storageUsd: 3.45, hardwareUsd: 4.56, electricityUsd: 5.67, perSeatDisplacedUsd: 6.78 },
  { apiUsd: 100, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 0.123456789, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 99.99, bandwidthUsd: 99.99, storageUsd: 99.99, hardwareUsd: 99.99, electricityUsd: 99.99, perSeatDisplacedUsd: 99.99 },
  { apiUsd: 1, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0 },
  { apiUsd: 0, bandwidthUsd: 1, storageUsd: 1, hardwareUsd: 1, electricityUsd: 1, perSeatDisplacedUsd: 1 },
  { apiUsd: 50, bandwidthUsd: 0.001, storageUsd: 0.001, hardwareUsd: 0.001, electricityUsd: 0.001, perSeatDisplacedUsd: 0.001 },
];

describe("Wave B-1 — CoI: 0% markup invariant across every dispatch shape", () => {
  it("CoI-1: directCost passthrough exactly equals apiUsd on internal-bundled path, regardless of tenant/savings", () => {
    let count = 0;
    for (const path of PATHS) {
      for (const tenantId of TENANTS) {
        for (const cost of COSTS) {
          for (const measuredSavingsUsd of SAVINGS) {
            const line = computePricingLine({ intentCost: cost, path, measuredSavingsUsd, tenantId });
            if (path === "internal-bundled") {
              expect(line.directCostPassthroughUsd).toBe(cost.apiUsd);
            } else {
              expect(line.directCostPassthroughUsd).toBe(0);
            }
            count++;
          }
        }
      }
    }
    // Sanity: the sweep is wide.
    expect(count).toBe(PATHS.length * TENANTS.length * COSTS.length * SAVINGS.length);
  });

  it("CoI-2: no derivable scaling-margin from DirectCost (delta to apiUsd is exactly 0)", () => {
    for (const cost of COSTS) {
      const internalPass = passthroughDirectCost(cost, "internal-bundled");
      const byoPass = passthroughDirectCost(cost, "byo");
      // On internal-bundled path, the passthrough equals the upstream cost
      // — i.e., zero margin is captured between provider and customer.
      expect(internalPass - cost.apiUsd).toBe(0);
      // On BYO path, no DirectCost ever appears on Stewardly's invoice.
      expect(byoPass).toBe(0);
    }
  });

  it("CoI-3: assertZeroMarkupOnDirectCost passes for every legitimate dispatch", () => {
    for (const path of PATHS) {
      for (const cost of COSTS) {
        const passthrough = passthroughDirectCost(cost, path);
        // The assertion must not throw on any legitimate combination.
        expect(() => assertZeroMarkupOnDirectCost(cost, path, passthrough)).not.toThrow();
      }
    }
  });

  it("CoI-4: assertZeroMarkupOnDirectCost FAILS LOUD on a deliberate violation (1¢ markup)", () => {
    const cost: IntentCost = {
      apiUsd: 1.0, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0,
    };
    // Add 1¢ markup — must be caught.
    expect(() =>
      assertZeroMarkupOnDirectCost(cost, "internal-bundled", 1.01),
    ).toThrow(NonCompetitionViolationError);
  });

  it("CoI-5: assertZeroMarkupOnDirectCost FAILS LOUD on a deliberate fractional-cent markup (rounding-attack vector)", () => {
    const cost: IntentCost = {
      apiUsd: 0.005, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0,
    };
    expect(() =>
      assertZeroMarkupOnDirectCost(cost, "internal-bundled", 0.0050001),
    ).toThrow(NonCompetitionViolationError);
  });

  it("CoI-6: assertZeroMarkupOnDirectCost FAILS LOUD if BYO path falsely receives a non-zero passthrough", () => {
    const cost: IntentCost = {
      apiUsd: 1.0, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0,
    };
    expect(() =>
      assertZeroMarkupOnDirectCost(cost, "byo", 1.0),
    ).toThrow(NonCompetitionViolationError);
  });

  it("CoI-7: ceiling activation does not modify the directCost component (CoI is pre-ceiling)", () => {
    // Construct a high-savings input that triggers the ceiling.
    const cost: IntentCost = {
      apiUsd: 10, bandwidthUsd: 0.5, storageUsd: 0.5, hardwareUsd: 0.5, electricityUsd: 0.5, perSeatDisplacedUsd: 0,
    };
    const line = computePricingLine({
      intentCost: cost,
      path: "internal-bundled",
      measuredSavingsUsd: 100_000_000, // huge, will bind ceiling
      tenantId: "t-default",
    });
    // Even with the ceiling potentially active, the *component* is reported
    // pre-ceiling and must equal apiUsd.
    expect(line.directCostPassthroughUsd).toBe(cost.apiUsd);
  });

  it("CoI-8: tenant-id never alters DirectCost passthrough", () => {
    const cost: IntentCost = {
      apiUsd: 7.77, bandwidthUsd: 0, storageUsd: 0, hardwareUsd: 0, electricityUsd: 0, perSeatDisplacedUsd: 0,
    };
    const distinct = TENANTS.map((tenantId) =>
      computePricingLine({ intentCost: cost, path: "internal-bundled", measuredSavingsUsd: 100, tenantId })
        .directCostPassthroughUsd,
    );
    // All values identical: tenant cannot move the DirectCost component.
    expect(new Set(distinct).size).toBe(1);
    expect(distinct[0]).toBe(cost.apiUsd);
  });
});
