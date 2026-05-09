/**
 * Wave F-1 — Virtual-user persona walkthrough
 * =============================================
 *
 * Commitment C-26: simulate at least four distinct personas exercising
 * the canonical workflows end-to-end at the substrate-router boundary.
 * The walkthrough composes hierarchy + admin-spectrum + counsel-gate +
 * memory + applet-scope modules — i.e., it pins that the governance
 * layer composes correctly when used by realistic user shapes.
 *
 * Personas:
 *   P1  Tenant admin operating directly
 *   P2  Organization admin with delegate (deputy)
 *   P3  Professional with assistant delegate
 *   P4  Client erasing their own portable memory
 *
 * Each walkthrough produces an attribution record and either succeeds
 * or fails-loud with a typed error.
 */
import { describe, it, expect } from "vitest";
import {
  envelopeOf,
  type DelegateScope,
} from "../hierarchy";
import { requireAppletScope, type AppletScopeActor, type AppletScopeRequirement } from "../appletScope";
import { evaluatePromotion } from "../adminSpectrum";
import { defaultGateRecords, type CounselGateRecord } from "../counselGates";
import { planErasure, type MemoryEntry } from "../../memory/primitives";

const tenant = "t-orion";

describe("Wave F-1 — virtual-user walkthroughs", () => {
  it("P1: Tenant admin operating directly succeeds on Tenant-scoped operation", () => {
    const actor: AppletScopeActor = {
      layer: "Tenant",
      tenantId: tenant,
      envelope: envelopeOf(["platform:configure", "platform:read"]),
    };
    const req: AppletScopeRequirement = { requiredLayer: "Tenant", requiredCapability: "platform:configure" };
    const att = requireAppletScope(actor, { tenantId: tenant }, req);
    expect(att.asDelegate).toBe(false);
    expect(att.layer).toBe("Tenant");
  });

  it("P2: Organization admin with deputy delegate (envelope subset) succeeds on Org operation", () => {
    const principalEnvelope = envelopeOf(["org:configure", "org:read", "org:invite"]);
    const delegateScope: DelegateScope = {
      principalLayer: "Organization",
      principalId: "org-principal-1",
      delegateId: "org-deputy-1",
      grantedEnvelope: envelopeOf(["org:read"]),
      revocableAt: null,
    };
    const actor: AppletScopeActor = {
      layer: "Organization",
      tenantId: tenant,
      delegateScope,
      // The acting actor's envelope must include the principal's grants
      // and the principal's overall envelope, so we use the principal's
      // envelope here (the delegate is acting on behalf of the principal).
      envelope: principalEnvelope,
    };
    const att = requireAppletScope(
      actor,
      { tenantId: tenant },
      { requiredLayer: "Organization", requiredCapability: "org:read" },
    );
    expect(att.asDelegate).toBe(true);
    expect(att.principalId).toBe("org-principal-1");
  });

  it("P3: Professional with assistant delegate fails on capability outside delegate envelope", () => {
    const principalEnvelope = envelopeOf(["client:read", "client:write", "client:advise"]);
    const delegateScope: DelegateScope = {
      principalLayer: "Professional",
      principalId: "pro-1",
      delegateId: "asst-1",
      grantedEnvelope: envelopeOf(["client:read"]), // strictly less than principal
      revocableAt: null,
    };
    const actor: AppletScopeActor = {
      layer: "Professional",
      tenantId: tenant,
      delegateScope,
      envelope: principalEnvelope,
    };
    expect(() =>
      requireAppletScope(
        actor,
        { tenantId: tenant },
        { requiredLayer: "Professional", requiredCapability: "client:advise" },
      ),
    ).toThrow();
  });

  it("P4: Client erasing their own portable memory succeeds for M2/M5 but skips M6/M7", () => {
    const ownerId = "client-1";
    const entries: MemoryEntry[] = [
      { id: "1", primitiveId: "M2.ConversationalLongTerm", ownerId, payload: {}, createdAt: 1000, expiresAt: null },
      { id: "2", primitiveId: "M5.ClientContext", ownerId, payload: {}, createdAt: 1000, expiresAt: null },
      { id: "3", primitiveId: "M6.RegulatoryEvidence", ownerId, payload: {}, createdAt: 1000, expiresAt: null },
      { id: "4", primitiveId: "M7.PerformanceMetrics", ownerId, payload: {}, createdAt: 1000, expiresAt: null },
    ];
    const plan = planErasure(
      { ownerId, primitives: ["M2.ConversationalLongTerm", "M5.ClientContext", "M6.RegulatoryEvidence", "M7.PerformanceMetrics"] },
      entries,
    );
    expect(plan.willErase).toHaveLength(2);
    expect(plan.willSkip.filter((s) => s.reason === "non-erasable")).toHaveLength(2);
  });

  it("P5: Cross-tenant operation always blocked even with full envelope", () => {
    const actor: AppletScopeActor = {
      layer: "Tenant",
      tenantId: "t-orion",
      envelope: envelopeOf(["everything"]),
    };
    expect(() =>
      requireAppletScope(actor, { tenantId: "t-acme" }, { requiredLayer: "Client" }),
    ).toThrow(/Tenant isolation/);
  });

  it("P6: SemiAutomatic promotion blocked when CG-6 (spectrum) gate is pending", () => {
    const r = evaluatePromotion({
      current: "Recommended",
      target: "SemiAutomatic",
      workloadClass: "general",
      successCount: 95,
      totalObservations: 100,
      incidentCount: 0,
      counselReviewStatus: "pending",
      tenantOptedIn: true,
    });
    expect(r.allowed).toBe(false);
    expect(r.blockedBy).toBe("PG-4");
  });

  it("P7: Counsel queue surface payload is non-empty on a fresh tenant (default-pending)", () => {
    const records = defaultGateRecords();
    const pending: CounselGateRecord[] = records.filter((r) => r.state === "pending");
    expect(pending.length).toBe(7);
  });
});
