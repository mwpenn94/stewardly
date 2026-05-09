/**
 * Wave A invariant tests — three-component pricing & non-competition
 *
 * Verifies the invariants documented in:
 *   server/pricing/index.ts            (I-1..I-7)
 *   server/pricing/valueShare.ts       (V-1..V-4)
 *   server/pricing/costPlus.ts         (CP-1..CP-5)
 *   server/pricing/directCost.ts       (DC-1..DC-4)
 *   server/pricing/protectionCeiling.ts (PC-1..PC-5)
 *   server/pricing/measuredSavings.ts  (MS-1..MS-8)
 *   server/pricing/byoScenarios.ts     (BS-1..BS-4)
 *   server/pricing/nonCompetition.ts   (NC-1..NC-4)
 *   server/pricing/providerRegistry.ts (PR-1..PR-5)
 *   server/pricing/affordanceLayer.ts  (AL-1..AL-5)
 */

import { describe, it, expect } from "vitest";
import type { IntentCost } from "../../engines/_intent";
import { computePricingLine, aggregatePricingLines } from "../index";
import { computeValueShare } from "../valueShare";
import { applyAppOperationalCostPlus, operationalBasis } from "../costPlus";
import { passthroughDirectCost } from "../directCost";
import { applyProtectionCeiling } from "../protectionCeiling";
import {
  computeMeasuredSavings,
  projectionWeight,
  empiricalWeight,
  TRANSITION_DAYS,
} from "../measuredSavings";
import { comparePricingAcrossScenarios } from "../byoScenarios";
import {
  assertZeroMarkupOnDirectCost,
  assertNoOutcomeIndependentMargin,
  assertOperationalMarkupBounded,
  assertNonCompeteCovenantPresent,
  assertNonCompetitionPosture,
  NonCompetitionViolationError,
  MAX_NON_COMPETING_OPERATIONAL_MARKUP,
} from "../nonCompetition";
import {
  listProviders,
  getProvider,
  listProvidersByKind,
  listBundledProviders,
} from "../providerRegistry";
import {
  canPerform,
  exportArtifact,
  importArtifact,
  isLayerUpstream,
  type ArtifactRecord,
  type PrincipalContext,
} from "../affordanceLayer";

const TENANT = "tenant_test_001";

function makeCost(overrides: Partial<IntentCost> = {}): IntentCost {
  return {
    apiUsd: 0.5,
    bandwidthUsd: 0.01,
    storageUsd: 0.005,
    hardwareUsd: 0.02,
    electricityUsd: 0.003,
    perSeatDisplacedUsd: 0,
    ...overrides,
  };
}

/* ================================================================ *
 * I-* — three-component orchestrator                                *
 * ================================================================ */

describe("pricing/index — three-component orchestrator", () => {
  it("I-1: customerInvoiceUsd >= 0 across many randomized inputs", () => {
    for (let i = 0; i < 100; i++) {
      const cost = makeCost({
        apiUsd: Math.random() * 5,
        bandwidthUsd: Math.random() * 0.1,
        storageUsd: Math.random() * 0.1,
        hardwareUsd: Math.random() * 0.5,
        electricityUsd: Math.random() * 0.02,
      });
      const savings = (Math.random() - 0.3) * 100; // can be negative
      const line = computePricingLine({
        intentCost: cost,
        path: "internal-bundled",
        measuredSavingsUsd: savings,
        tenantId: TENANT,
      });
      expect(line.customerInvoiceUsd).toBeGreaterThanOrEqual(0);
    }
  });

  it("I-2: customerInvoiceUsd <= ceilingUsd always", () => {
    for (let i = 0; i < 100; i++) {
      const cost = makeCost({ apiUsd: Math.random() * 5 });
      const savings = Math.random() * 1000; // large savings to stress ceiling
      const line = computePricingLine({
        intentCost: cost,
        path: "internal-bundled",
        measuredSavingsUsd: savings,
        tenantId: TENANT,
      });
      expect(line.customerInvoiceUsd).toBeLessThanOrEqual(line.ceilingUsd);
    }
  });

  it("I-3: directCostPassthroughUsd === apiUsd on internal-bundled", () => {
    const cost = makeCost({ apiUsd: 0.42 });
    const line = computePricingLine({
      intentCost: cost,
      path: "internal-bundled",
      measuredSavingsUsd: 10,
      tenantId: TENANT,
    });
    expect(line.directCostPassthroughUsd).toBe(0.42);
  });

  it("I-3: directCostPassthroughUsd === 0 on BYO", () => {
    const cost = makeCost({ apiUsd: 0.42 });
    const line = computePricingLine({
      intentCost: cost,
      path: "byo",
      measuredSavingsUsd: 10,
      tenantId: TENANT,
    });
    expect(line.directCostPassthroughUsd).toBe(0);
  });

  it("I-4: appOperationalUsd > 0 whenever the intent actually executed", () => {
    const cost = makeCost();
    const line = computePricingLine({
      intentCost: cost,
      path: "byo",
      measuredSavingsUsd: 0,
      tenantId: TENANT,
    });
    expect(line.appOperationalUsd).toBeGreaterThan(0);
  });

  it("I-5: valueShareUsd >= 0 even for negative MeasuredSavings", () => {
    const line = computePricingLine({
      intentCost: makeCost(),
      path: "byo",
      measuredSavingsUsd: -1000,
      tenantId: TENANT,
    });
    expect(line.valueShareUsd).toBe(0);
  });

  it("aggregate: ceilingAppliedCount counts binding ceilings correctly", () => {
    const lines = [
      computePricingLine({
        intentCost: makeCost(),
        path: "byo",
        measuredSavingsUsd: 0,
        tenantId: TENANT,
      }),
      computePricingLine({
        intentCost: makeCost(),
        path: "byo",
        measuredSavingsUsd: 100000,
        tenantId: TENANT,
      }),
    ];
    const agg = aggregatePricingLines(lines);
    expect(agg.ceilingAppliedCount).toBe(1);
  });
});

/* ================================================================ *
 * V-* — ValueShare                                                  *
 * ================================================================ */

describe("pricing/valueShare — V-1..V-4", () => {
  it("V-1: ValueShare >= 0 always", () => {
    expect(computeValueShare(-100, TENANT)).toBe(0);
    expect(computeValueShare(0, TENANT)).toBe(0);
    expect(computeValueShare(100, TENANT)).toBeGreaterThan(0);
  });

  it("V-2: ValueShare = rate * max(0, MeasuredSavings)", () => {
    expect(computeValueShare(100, TENANT)).toBeCloseTo(20, 6); // 20% default
  });

  it("V-4: identical formula across paths (path-independent)", () => {
    // ValueShare doesn't depend on path; the orchestrator passes savings only.
    const internal = computePricingLine({
      intentCost: makeCost(),
      path: "internal-bundled",
      measuredSavingsUsd: 100,
      tenantId: TENANT,
    });
    const byo = computePricingLine({
      intentCost: makeCost(),
      path: "byo",
      measuredSavingsUsd: 100,
      tenantId: TENANT,
    });
    expect(internal.valueShareUsd).toBe(byo.valueShareUsd);
  });
});

/* ================================================================ *
 * CP-* — Cost-Plus                                                  *
 * ================================================================ */

describe("pricing/costPlus — CP-1..CP-5", () => {
  it("CP-2: apiUsd is NEVER part of the cost-plus basis", () => {
    const a = operationalBasis(makeCost({ apiUsd: 0 }));
    const b = operationalBasis(makeCost({ apiUsd: 1000 }));
    expect(a).toBe(b); // changing apiUsd does not change the basis
  });

  it("CP-4: identical formula across paths (path-independent)", () => {
    const cost = makeCost({ apiUsd: 0.5 });
    const internal = applyAppOperationalCostPlus(cost, TENANT);
    const byo = applyAppOperationalCostPlus(cost, TENANT);
    expect(internal).toBe(byo);
  });

  it("CP-5: appOperationalUsd = (1+markup) * basis", () => {
    const cost = makeCost();
    const out = applyAppOperationalCostPlus(cost, TENANT);
    const basis = operationalBasis(cost);
    expect(out).toBeCloseTo(basis * 1.3, 8); // 30% default markup
  });
});

/* ================================================================ *
 * DC-* — DirectCost                                                 *
 * ================================================================ */

describe("pricing/directCost — DC-1..DC-4", () => {
  it("DC-1: directCostPassthroughUsd === apiUsd on internal-bundled", () => {
    const cost = makeCost({ apiUsd: 1.234 });
    expect(passthroughDirectCost(cost, "internal-bundled")).toBe(1.234);
  });

  it("DC-2: directCostPassthroughUsd === 0 on BYO", () => {
    const cost = makeCost({ apiUsd: 1.234 });
    expect(passthroughDirectCost(cost, "byo")).toBe(0);
  });

  it("DC-3: zero markup vs apiUsd", () => {
    for (let i = 0; i < 50; i++) {
      const apiUsd = Math.random() * 100;
      const out = passthroughDirectCost(makeCost({ apiUsd }), "internal-bundled");
      expect(out).toBe(apiUsd); // strict equality, not approx
    }
  });
});

/* ================================================================ *
 * PC-* — Protection Ceiling                                         *
 * ================================================================ */

describe("pricing/protectionCeiling — PC-1..PC-5", () => {
  it("PC-1: ceilingUsd > 0 when intent executed", () => {
    const r = applyProtectionCeiling({
      rawTotalUsd: 0,
      intentCost: makeCost(),
      path: "internal-bundled",
      tenantId: TENANT,
    });
    expect(r.ceilingUsd).toBeGreaterThan(0);
  });

  it("PC-2: customerInvoiceUsd <= ceilingUsd", () => {
    const r = applyProtectionCeiling({
      rawTotalUsd: 999_999,
      intentCost: makeCost({ apiUsd: 0.1 }),
      path: "internal-bundled",
      tenantId: TENANT,
    });
    expect(r.finalUsd).toBeLessThanOrEqual(r.ceilingUsd);
    expect(r.ceilingApplied).toBe(true);
  });

  it("PC-5: BYO ceiling EXCLUDES apiUsd from the basis", () => {
    const cost = makeCost({ apiUsd: 100 });
    const internal = applyProtectionCeiling({
      rawTotalUsd: 0,
      intentCost: cost,
      path: "internal-bundled",
      tenantId: TENANT,
    });
    const byo = applyProtectionCeiling({
      rawTotalUsd: 0,
      intentCost: cost,
      path: "byo",
      tenantId: TENANT,
    });
    expect(internal.ceilingUsd).toBeGreaterThan(byo.ceilingUsd);
  });
});

/* ================================================================ *
 * MS-* — MeasuredSavings two-stage methodology                      *
 * ================================================================ */

describe("pricing/measuredSavings — MS-1..MS-8", () => {
  it("MS-1: projectionWeight(0) === 1", () => {
    expect(projectionWeight(0)).toBe(1);
  });

  it("MS-2: projectionWeight(90) === 0", () => {
    expect(projectionWeight(TRANSITION_DAYS)).toBe(0);
    expect(projectionWeight(TRANSITION_DAYS + 30)).toBe(0);
  });

  it("MS-3: projectionWeight ∈ [0, 1] for all d >= 0", () => {
    for (let d = 0; d < 200; d++) {
      const w = projectionWeight(d);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    }
  });

  it("MS-4: projectionWeight is monotonically non-increasing", () => {
    let last = projectionWeight(0);
    for (let d = 1; d <= 200; d++) {
      const w = projectionWeight(d);
      expect(w).toBeLessThanOrEqual(last);
      last = w;
    }
  });

  it("MS-5: weights sum to 1 in [0, 90]", () => {
    for (let d = 0; d <= TRANSITION_DAYS; d += 5) {
      expect(projectionWeight(d) + empiricalWeight(d)).toBeCloseTo(1, 9);
    }
  });

  it("MS-6: projection-only fallback when empirical absent", () => {
    const r = computeMeasuredSavings({
      daysSinceOnboarding: 60,
      projectedSavingsUsd: 100,
    });
    expect(r.measuredSavingsUsd).toBe(100);
    expect(r.signalSources).toEqual(["projection"]);
  });

  it("MS-7: empirical-only fallback when projection absent", () => {
    const r = computeMeasuredSavings({
      daysSinceOnboarding: 5,
      empiricalSavingsUsd: 50,
    });
    expect(r.measuredSavingsUsd).toBe(50);
    expect(r.signalSources).toEqual(["empirical"]);
  });

  it("blend at Day 45 is 50/50", () => {
    const r = computeMeasuredSavings({
      daysSinceOnboarding: 45,
      projectedSavingsUsd: 100,
      empiricalSavingsUsd: 200,
    });
    expect(r.measuredSavingsUsd).toBeCloseTo(150, 6);
  });
});

/* ================================================================ *
 * BS-* — BYO scenario equivalence                                   *
 * ================================================================ */

describe("pricing/byoScenarios — BS-1..BS-4", () => {
  const cost = makeCost({ apiUsd: 0.5 });
  const result = comparePricingAcrossScenarios({
    intentCost: cost,
    measuredSavingsUsd: 100,
    tenantId: TENANT,
  });

  it("BS-1: valueShareUsd identical across all four scenarios", () => {
    expect(result.S1.valueShareUsd).toBe(result.S2.valueShareUsd);
    expect(result.S2.valueShareUsd).toBe(result.S3.valueShareUsd);
    expect(result.S3.valueShareUsd).toBe(result.S4.valueShareUsd);
  });

  it("BS-2: appOperationalUsd identical across all four scenarios", () => {
    expect(result.S1.appOperationalUsd).toBe(result.S2.appOperationalUsd);
    expect(result.S2.appOperationalUsd).toBe(result.S3.appOperationalUsd);
    expect(result.S3.appOperationalUsd).toBe(result.S4.appOperationalUsd);
  });

  it("BS-3: directCostPassthroughUsd is apiUsd on S1/S2, 0 on S3/S4", () => {
    expect(result.S1.directCostPassthroughUsd).toBe(0.5);
    expect(result.S2.directCostPassthroughUsd).toBe(0.5);
    expect(result.S3.directCostPassthroughUsd).toBe(0);
    expect(result.S4.directCostPassthroughUsd).toBe(0);
  });

  it("BS-4: zero margin on provider DirectCost (passthrough = apiUsd exactly)", () => {
    expect(result.S1.directCostPassthroughUsd - cost.apiUsd).toBe(0);
    expect(result.S2.directCostPassthroughUsd - cost.apiUsd).toBe(0);
  });
});

/* ================================================================ *
 * NC-* — Non-competition enforcement                                *
 * ================================================================ */

describe("pricing/nonCompetition — NC-1..NC-4", () => {
  it("NC-1: passes when passthrough matches apiUsd on internal-bundled", () => {
    const cost = makeCost({ apiUsd: 0.5 });
    expect(() => assertZeroMarkupOnDirectCost(cost, "internal-bundled", 0.5)).not.toThrow();
  });

  it("NC-1: throws when passthrough != apiUsd", () => {
    const cost = makeCost({ apiUsd: 0.5 });
    expect(() => assertZeroMarkupOnDirectCost(cost, "internal-bundled", 0.6)).toThrow(
      NonCompetitionViolationError,
    );
  });

  it("NC-2: throws on negative valueShareUsd", () => {
    const fakeLine = { valueShareUsd: -1 } as never;
    expect(() => assertNoOutcomeIndependentMargin(fakeLine)).toThrow(
      NonCompetitionViolationError,
    );
  });

  it("NC-3: bounds the operational markup", () => {
    expect(() => assertOperationalMarkupBounded(0)).not.toThrow();
    expect(() => assertOperationalMarkupBounded(MAX_NON_COMPETING_OPERATIONAL_MARKUP)).not.toThrow();
    expect(() => assertOperationalMarkupBounded(MAX_NON_COMPETING_OPERATIONAL_MARKUP + 0.01)).toThrow(
      NonCompetitionViolationError,
    );
    expect(() => assertOperationalMarkupBounded(-0.01)).toThrow(NonCompetitionViolationError);
  });

  it("NC-4: throws when AI non-compete covenant flag is missing", () => {
    expect(() => assertNonCompeteCovenantPresent({})).toThrow(NonCompetitionViolationError);
    expect(() =>
      assertNonCompeteCovenantPresent({ aiNonCompeteCovenantCounselReviewed: false }),
    ).toThrow(NonCompetitionViolationError);
    expect(() =>
      assertNonCompeteCovenantPresent({ aiNonCompeteCovenantCounselReviewed: true }),
    ).not.toThrow();
  });

  it("composite assertNonCompetitionPosture passes with valid posture", () => {
    const cost = makeCost({ apiUsd: 0.5 });
    const line = computePricingLine({
      intentCost: cost,
      path: "internal-bundled",
      measuredSavingsUsd: 50,
      tenantId: TENANT,
    });
    expect(() =>
      assertNonCompetitionPosture(line, cost, "internal-bundled", 0.3, {
        aiNonCompeteCovenantCounselReviewed: true,
      }),
    ).not.toThrow();
  });
});

/* ================================================================ *
 * PR-* — Provider registry                                          *
 * ================================================================ */

describe("pricing/providerRegistry — PR-1..PR-5", () => {
  it("PR-1: every provider has a unique ID", () => {
    const ids = listProviders().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("PR-2: no provider is privileged (no isDefault/isPreferred/isBaseline)", () => {
    for (const p of listProviders()) {
      // these flags must NOT exist on the type. We check at runtime too.
      expect((p as Record<string, unknown>).isDefault).toBeUndefined();
      expect((p as Record<string, unknown>).isPreferred).toBeUndefined();
      expect((p as Record<string, unknown>).isBaseline).toBeUndefined();
    }
  });

  it("PR-3: Manus is registered as a provider", () => {
    const manus = getProvider("manus");
    expect(manus).toBeDefined();
    expect(manus?.id).toBe("manus");
  });

  it("PR-4: bundled internal default exists and is NOT Manus", () => {
    const bundled = listBundledProviders();
    expect(bundled.length).toBeGreaterThanOrEqual(1);
    expect(bundled.find((p) => p.id === "manus")).toBeUndefined();
  });

  it("PR-5: listProviders returns alphabetical order", () => {
    const ids = listProviders().map((p) => p.id);
    const sorted = [...ids].sort();
    expect(ids).toEqual(sorted);
  });

  it("listProvidersByKind('llm') returns only LLM-capable providers", () => {
    for (const p of listProvidersByKind("llm")) {
      expect(p.kinds).toContain("llm");
    }
  });
});

/* ================================================================ *
 * AL-* — Affordance layer                                           *
 * ================================================================ */

describe("pricing/affordanceLayer — AL-1..AL-5", () => {
  function makeArtifact(overrides: Partial<ArtifactRecord> = {}): ArtifactRecord {
    const now = new Date();
    return {
      id: "artifact_001",
      kind: "tool",
      ownerLayer: "professional",
      ownerPrincipalId: "prof_001",
      lifecycleState: "draft",
      complianceClass: false,
      counselReviewedFlag: false,
      payload: { foo: "bar" },
      delegateScopes: [],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  it("AL-1: every artifact has stable id, ownerLayer, lifecycleState", () => {
    const a = makeArtifact();
    expect(a.id).toBeTruthy();
    expect(a.ownerLayer).toBe("professional");
    expect(a.lifecycleState).toBe("draft");
  });

  it("AL-2: import then export round-trips losslessly", () => {
    const original = makeArtifact({ payload: { foo: "bar", nested: { n: 42 } } });
    const portable = exportArtifact(original);
    const imported = importArtifact(portable, { principalId: "prof_002", layer: "professional" }, {
      id: "artifact_002",
    });
    expect(imported.payload).toEqual(original.payload);
    expect(imported.kind).toBe(original.kind);
    expect(imported.complianceClass).toBe(original.complianceClass);
  });

  it("AL-3: principal at downstream layer cannot write without delegate-scope", () => {
    const artifact = makeArtifact({ ownerLayer: "tenant", ownerPrincipalId: "tenant_admin" });
    const downstreamPrincipal: PrincipalContext = { principalId: "advisor_x", layer: "professional" };
    expect(canPerform(artifact, downstreamPrincipal, "update")).toBe(false);
  });

  it("AL-3: delegate-scope grants strict subset of permissions", () => {
    const artifact = makeArtifact({
      ownerLayer: "tenant",
      ownerPrincipalId: "tenant_admin",
      delegateScopes: [
        {
          delegatePrincipalId: "advisor_x",
          permissions: ["read", "update"],
          expiresAt: null,
          revokedAt: null,
        },
      ],
    });
    const principal: PrincipalContext = { principalId: "advisor_x", layer: "professional" };
    expect(canPerform(artifact, principal, "read")).toBe(true);
    expect(canPerform(artifact, principal, "update")).toBe(true);
    expect(canPerform(artifact, principal, "delete")).toBe(false);
    expect(canPerform(artifact, principal, "publish")).toBe(false);
  });

  it("AL-3: revoked delegate-scope is honored immediately", () => {
    const artifact = makeArtifact({
      ownerLayer: "tenant",
      ownerPrincipalId: "tenant_admin",
      delegateScopes: [
        {
          delegatePrincipalId: "advisor_x",
          permissions: ["update"],
          expiresAt: null,
          revokedAt: new Date(Date.now() - 1000),
        },
      ],
    });
    const principal: PrincipalContext = { principalId: "advisor_x", layer: "professional" };
    expect(canPerform(artifact, principal, "update")).toBe(false);
  });

  it("AL-3: upstream layers have read access by default", () => {
    const artifact = makeArtifact({ ownerLayer: "professional", ownerPrincipalId: "prof_001" });
    expect(canPerform(artifact, { principalId: "tenant_admin", layer: "tenant" }, "read")).toBe(
      true,
    );
    expect(canPerform(artifact, { principalId: "tenant_admin", layer: "tenant" }, "update")).toBe(
      false,
    );
  });

  it("isLayerUpstream: platform > tenant > org > team > professional > client", () => {
    expect(isLayerUpstream("platform", "client")).toBe(true);
    expect(isLayerUpstream("tenant", "professional")).toBe(true);
    expect(isLayerUpstream("client", "professional")).toBe(false);
    expect(isLayerUpstream("professional", "professional")).toBe(true);
  });

  it("AL-5: compliance-class artifact without counsel review cannot publish/update", () => {
    const artifact = makeArtifact({
      complianceClass: true,
      counselReviewedFlag: false,
      ownerPrincipalId: "owner_001",
    });
    const owner: PrincipalContext = { principalId: "owner_001", layer: "professional" };
    expect(canPerform(artifact, owner, "publish")).toBe(false);
    expect(canPerform(artifact, owner, "update")).toBe(false);
    expect(canPerform(artifact, owner, "read")).toBe(true);
  });
});
