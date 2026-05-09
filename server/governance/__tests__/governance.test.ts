/**
 * Wave C-1/C-2/C-3 — Governance module invariant tests
 * ======================================================
 *
 * Pins:
 *   H-1  five canonical layers exist with monotone weights
 *   H-2  requireLayerAtLeast: actor at higher layer passes
 *   H-3  requireLayerAtLeast: actor at lower layer fails
 *   H-4  requireSameTenant: identical tenant passes
 *   H-5  requireSameTenant: cross-tenant fails
 *   H-6  envelopeOf round-trips an iterable
 *   H-7  assertSubsetOfPrincipal: subset passes
 *   H-8  assertSubsetOfPrincipal: superset fails (escalation caught)
 *   H-9  assertSubsetOfPrincipal: equality passes
 *   H-10 buildAttribution: attaches both delegate and principal
 *   H-11 patternToPrincipalLayer: covers all 5 canonical patterns
 *
 *   AS-1 evaluatePromotion: all 5 criteria green -> allowed
 *   AS-2 evaluatePromotion: blocked when reliability < 95%
 *   AS-3 evaluatePromotion: blocked when observations < 50
 *   AS-4 evaluatePromotion: blocked when incidents > 0
 *   AS-5 evaluatePromotion: blocked when counsel not cleared
 *   AS-6 evaluatePromotion: blocked when tenant not opted in
 *   AS-7 evaluatePromotion: rung-skipping is rejected
 *   AS-8 evaluatePromotion: compliance + Automatic always blocked
 *   AS-9 evaluateDemotion: incident triggers demotion
 *   AS-10 evaluateDemotion: reliability dip triggers demotion
 *   AS-11 evaluateDemotion: opt-out blocks demotion
 *
 *   CG-1 ALL_GATES has exactly 7 entries
 *   CG-2 requireGateCleared: cleared passes
 *   CG-3 requireGateCleared: pending throws
 *   CG-4 requireGateCleared: blocked throws
 *   CG-5 pendingGates: returns the surface payload (pending + blocked)
 *   CG-6 defaultGateRecords: every gate starts pending
 */

import { describe, it, expect } from "vitest";
import {
  LAYER_WEIGHT,
  ALL_LAYERS,
  envelopeOf,
  requireLayerAtLeast,
  requireSameTenant,
  assertSubsetOfPrincipal,
  buildAttribution,
  patternToPrincipalLayer,
  HierarchyViolation,
  DelegateEscalation,
  TenantIsolationViolation,
} from "../hierarchy";
import {
  evaluatePromotion,
  evaluateDemotion,
  RUNG_ORDER,
} from "../adminSpectrum";
import {
  ALL_GATES,
  defaultGateRecords,
  pendingGates,
  requireGateCleared,
  CounselGateNotCleared,
} from "../counselGates";
import { requireAppletScope } from "../appletScope";

describe("Wave C-1 — five-layer hierarchy + delegate scope", () => {
  it("H-1: five canonical layers with monotone weights", () => {
    expect(ALL_LAYERS).toEqual(["Tenant", "Organization", "Team", "Professional", "Client"]);
    const weights = ALL_LAYERS.map((l) => LAYER_WEIGHT[l]);
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i - 1]).toBeGreaterThan(weights[i]);
    }
  });
  it("H-2: requireLayerAtLeast passes when actor >= required", () => {
    expect(() => requireLayerAtLeast("Tenant", "Client")).not.toThrow();
    expect(() => requireLayerAtLeast("Professional", "Professional")).not.toThrow();
  });
  it("H-3: requireLayerAtLeast fails when actor < required", () => {
    expect(() => requireLayerAtLeast("Client", "Tenant")).toThrow(HierarchyViolation);
    expect(() => requireLayerAtLeast("Professional", "Tenant")).toThrow(HierarchyViolation);
  });
  it("H-4/H-5: requireSameTenant", () => {
    expect(() => requireSameTenant("t-1", "t-1")).not.toThrow();
    expect(() => requireSameTenant("t-1", "t-2")).toThrow(TenantIsolationViolation);
  });
  it("H-6: envelopeOf round-trips an iterable", () => {
    const e = envelopeOf(["read", "write"]);
    expect(e.has("read")).toBe(true);
    expect(e.has("admin")).toBe(false);
  });
  it("H-7/H-8/H-9: subset/equality pass; superset escalates", () => {
    const principal = envelopeOf(["read", "write", "delete"]);
    expect(() => assertSubsetOfPrincipal(principal, envelopeOf(["read"]))).not.toThrow();
    expect(() => assertSubsetOfPrincipal(principal, envelopeOf(["read", "write", "delete"]))).not.toThrow();
    expect(() => assertSubsetOfPrincipal(principal, envelopeOf(["admin"]))).toThrow(DelegateEscalation);
  });
  it("H-10: buildAttribution attaches delegate and principal", () => {
    const att = buildAttribution({
      principalLayer: "Professional",
      principalId: "p-1",
      delegateId: "d-1",
      grantedEnvelope: envelopeOf(["read"]),
      revocableAt: null,
    });
    expect(att).toMatchObject({
      layer: "Professional",
      delegateId: "d-1",
      principalId: "p-1",
      envelope: ["read"],
    });
  });
  it("H-11: patternToPrincipalLayer covers all 5 canonical patterns", () => {
    expect(patternToPrincipalLayer("professional-to-assistant")).toBe("Professional");
    expect(patternToPrincipalLayer("tenant-admin-to-deputy")).toBe("Tenant");
    expect(patternToPrincipalLayer("organization-to-deputy")).toBe("Organization");
    expect(patternToPrincipalLayer("team-supervisor-to-acting-supervisor")).toBe("Team");
    expect(patternToPrincipalLayer("client-to-authorized-representative")).toBe("Client");
  });
});

describe("Wave C-2 — admin spectrum promotion + demotion", () => {
  const allGreen = {
    current: "Manual" as const,
    target: "Recommended" as const,
    workloadClass: "general" as const,
    successCount: 95,
    totalObservations: 100,
    incidentCount: 0,
    counselReviewStatus: "cleared" as const,
    tenantOptedIn: true,
  };

  it("AS-1: all green -> allowed", () => {
    const r = evaluatePromotion(allGreen);
    expect(r.allowed).toBe(true);
    expect(r.blockedBy).toBeNull();
  });
  it("AS-2: blocked when reliability < 95%", () => {
    const r = evaluatePromotion({ ...allGreen, successCount: 50 });
    expect(r.allowed).toBe(false);
    expect(r.blockedBy).toBe("PG-1");
  });
  it("AS-3: blocked when observations < 50", () => {
    const r = evaluatePromotion({ ...allGreen, totalObservations: 10, successCount: 10 });
    expect(r.allowed).toBe(false);
    expect(r.blockedBy).toBe("PG-2");
  });
  it("AS-4: blocked when incidents > 0", () => {
    const r = evaluatePromotion({ ...allGreen, incidentCount: 1 });
    expect(r.allowed).toBe(false);
    expect(r.blockedBy).toBe("PG-3");
  });
  it("AS-5: blocked when counsel not cleared", () => {
    const r = evaluatePromotion({ ...allGreen, counselReviewStatus: "pending" });
    expect(r.allowed).toBe(false);
    expect(r.blockedBy).toBe("PG-4");
  });
  it("AS-6: blocked when tenant not opted in", () => {
    const r = evaluatePromotion({ ...allGreen, tenantOptedIn: false });
    expect(r.allowed).toBe(false);
    expect(r.blockedBy).toBe("PG-5");
  });
  it("AS-7: rung-skipping rejected", () => {
    const r = evaluatePromotion({ ...allGreen, current: "Manual", target: "SemiAutomatic" });
    expect(r.allowed).toBe(false);
  });
  it("AS-8: compliance + Automatic always blocked", () => {
    // Even with everything else green
    const r = evaluatePromotion({
      ...allGreen,
      workloadClass: "compliance",
      current: "SupervisedAuto",
      target: "Automatic",
    });
    expect(r.allowed).toBe(false);
    expect(r.blockedBy).toBe("PG-4");
  });
  it("AS-9: incident triggers demotion", () => {
    const d = evaluateDemotion({
      current: "SemiAutomatic",
      hadIncident: true,
      recentSuccessCount: 100,
      recentTotalObservations: 100,
      tenantOptOutFromAutoDemotion: false,
    });
    expect(d.shouldDemote).toBe(true);
    expect(d.next).toBe("Recommended");
  });
  it("AS-10: reliability dip triggers demotion", () => {
    const d = evaluateDemotion({
      current: "Recommended",
      hadIncident: false,
      recentSuccessCount: 80,
      recentTotalObservations: 100,
      tenantOptOutFromAutoDemotion: false,
    });
    expect(d.shouldDemote).toBe(true);
    expect(d.next).toBe("Manual");
  });
  it("AS-11: opt-out blocks demotion", () => {
    const d = evaluateDemotion({
      current: "Recommended",
      hadIncident: true,
      recentSuccessCount: 0,
      recentTotalObservations: 100,
      tenantOptOutFromAutoDemotion: true,
    });
    expect(d.shouldDemote).toBe(false);
  });
  it("AS-12: RUNG_ORDER has 5 rungs", () => {
    expect(RUNG_ORDER).toHaveLength(5);
  });
});

describe("Wave C-3 — counsel gates", () => {
  it("CG-1: ALL_GATES has exactly 7 entries", () => {
    expect(ALL_GATES).toHaveLength(7);
  });
  it("CG-2/CG-3/CG-4: requireGateCleared", () => {
    expect(() =>
      requireGateCleared({ id: "CG-1-aggregate-assumption-mnv", state: "cleared", lastUpdatedAt: 0 }),
    ).not.toThrow();
    expect(() =>
      requireGateCleared({ id: "CG-1-aggregate-assumption-mnv", state: "pending", lastUpdatedAt: 0 }),
    ).toThrow(CounselGateNotCleared);
    expect(() =>
      requireGateCleared({ id: "CG-1-aggregate-assumption-mnv", state: "blocked", lastUpdatedAt: 0 }),
    ).toThrow(CounselGateNotCleared);
  });
  it("CG-5: pendingGates returns surface payload", () => {
    const records = defaultGateRecords();
    records[0].state = "blocked";
    const payload = pendingGates(records);
    expect(payload.pending.length).toBe(6);
    expect(payload.blocked.length).toBe(1);
  });
  it("CG-6: defaultGateRecords starts every gate pending", () => {
    const recs = defaultGateRecords();
    expect(recs).toHaveLength(7);
    expect(recs.every((r) => r.state === "pending")).toBe(true);
  });
});

describe("Wave C-4 — requireAppletScope uniform middleware", () => {
  const actor = {
    layer: "Professional" as const,
    tenantId: "t-1",
    envelope: envelopeOf(["applet:read", "applet:write"]),
  };
  const target = { tenantId: "t-1" };

  it("AS-1: tenant isolation enforced", () => {
    expect(() =>
      requireAppletScope(actor, { tenantId: "t-2" }, { requiredLayer: "Client" }),
    ).toThrow(/Tenant isolation/);
  });
  it("AS-2: layer authorization enforced", () => {
    expect(() =>
      requireAppletScope(actor, target, { requiredLayer: "Tenant" }),
    ).toThrow();
  });
  it("AS-3: capability check passes when present in envelope", () => {
    const att = requireAppletScope(actor, target, { requiredLayer: "Professional", requiredCapability: "applet:read" });
    expect(att.asDelegate).toBe(false);
    expect(att.envelope).toContain("applet:read");
  });
  it("AS-3: capability check fails when missing", () => {
    expect(() =>
      requireAppletScope(actor, target, { requiredLayer: "Professional", requiredCapability: "applet:admin" }),
    ).toThrow(/missing required capability/);
  });
  it("AS-4: counsel gate enforced", () => {
    const blocked = { id: "CG-1-aggregate-assumption-mnv" as const, state: "blocked" as const, lastUpdatedAt: 0 };
    expect(() =>
      requireAppletScope(actor, target, {
        requiredLayer: "Professional",
        requiredCounselGate: blocked,
      }),
    ).toThrow();
  });
  it("delegate path: attribution includes both delegate and principal", () => {
    const delegateActor = {
      ...actor,
      delegateScope: {
        principalLayer: "Professional" as const,
        principalId: "p-1",
        delegateId: "d-1",
        grantedEnvelope: envelopeOf(["applet:read"]),
        revocableAt: null,
      },
    };
    const att = requireAppletScope(delegateActor, target, {
      requiredLayer: "Professional",
      requiredCapability: "applet:read",
    });
    expect(att.asDelegate).toBe(true);
    expect(att.principalId).toBe("p-1");
    expect(att.delegateId).toBe("d-1");
  });
});
