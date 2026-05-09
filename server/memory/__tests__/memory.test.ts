/**
 * Wave D — Memory primitives + M&V tracker tests
 * ================================================
 *
 *   MP-1  ALL_PRIMITIVES has 8 entries
 *   MP-2  Each policy has consistent classification/retention/portable/erasable
 *   MP-3  classifyEntry returns the registered classification
 *   MP-4  expirationFor returns null for retentionDays=0 (perpetual)
 *   MP-5  expirationFor returns createdAt + days*ms for non-zero
 *   MP-6  assertPortable: portable primitives pass; non-portable throws
 *   MP-7  assertErasable: erasable primitives pass; M6 + M7 throw
 *   MP-8  buildPortableProfile only includes portable, non-expired entries
 *   MP-9  buildPortableProfile skips entries belonging to other owners
 *   MP-10 planErasure: erasable entries enter willErase
 *   MP-11 planErasure: M6 RegulatoryEvidence enters willSkip[non-erasable]
 *   MP-12 planErasure: cross-owner entries enter willSkip[wrong-owner]
 *   MP-13 planErasure: out-of-scope primitives are skipped
 *
 *   MV-1  Day 1: 100% projection
 *   MV-2  Day 90: 100% empirical
 *   MV-3  Mid-window: linear blend
 *   MV-4  CG-1 not cleared forces projection -> 0
 *   MV-5  Negative blends are floored at 0
 *   MV-6  aggregateMV sums correctly
 */

import { describe, it, expect } from "vitest";
import {
  ALL_PRIMITIVES,
  MEMORY_PRIMITIVE_POLICY,
  classifyEntry,
  expirationFor,
  assertPortable,
  assertErasable,
  NotPortableError,
  NotErasableError,
  buildPortableProfile,
  planErasure,
  type MemoryEntry,
} from "../primitives";
import { computeMeasuredSavings, aggregateMV } from "../mvTracker";
import type { CounselGateRecord } from "../../governance/counselGates";

const cleared: CounselGateRecord = { id: "CG-1-aggregate-assumption-mnv", state: "cleared", lastUpdatedAt: 0 };
const pending: CounselGateRecord = { id: "CG-1-aggregate-assumption-mnv", state: "pending", lastUpdatedAt: 0 };

describe("Wave D — memory primitives M1–M8", () => {
  it("MP-1: ALL_PRIMITIVES has 8 entries", () => {
    expect(ALL_PRIMITIVES).toHaveLength(8);
  });
  it("MP-2: each policy has all required fields", () => {
    for (const id of ALL_PRIMITIVES) {
      const p = MEMORY_PRIMITIVE_POLICY[id];
      expect(p.id).toBe(id);
      expect(p.description.length).toBeGreaterThan(0);
      expect(["none", "pii", "phi", "financial", "regulatory"]).toContain(p.classification);
    }
  });
  it("MP-3: classifyEntry returns registered classification", () => {
    expect(classifyEntry("M6.RegulatoryEvidence")).toBe("regulatory");
    expect(classifyEntry("M5.ClientContext")).toBe("pii");
    expect(classifyEntry("M7.PerformanceMetrics")).toBe("financial");
  });
  it("MP-4: expirationFor returns null for perpetual primitives", () => {
    expect(expirationFor("M4.ProfessionalKnowledge", 1000)).toBeNull();
    expect(expirationFor("M8.PortableProfile", 1000)).toBeNull();
  });
  it("MP-5: expirationFor returns correct ms for finite TTLs", () => {
    const created = 1_700_000_000_000;
    const exp = expirationFor("M1.ConversationalShortTerm", created);
    // 7 days
    expect(exp).toBe(created + 7 * 24 * 60 * 60 * 1000);
  });
  it("MP-6: assertPortable", () => {
    expect(() => assertPortable("M2.ConversationalLongTerm")).not.toThrow();
    expect(() => assertPortable("M1.ConversationalShortTerm")).toThrow(NotPortableError);
    expect(() => assertPortable("M3.WorkflowState")).toThrow(NotPortableError);
    expect(() => assertPortable("M6.RegulatoryEvidence")).toThrow(NotPortableError);
  });
  it("MP-7: assertErasable", () => {
    expect(() => assertErasable("M2.ConversationalLongTerm")).not.toThrow();
    expect(() => assertErasable("M6.RegulatoryEvidence")).toThrow(NotErasableError);
    expect(() => assertErasable("M7.PerformanceMetrics")).toThrow(NotErasableError);
  });
  it("MP-8: buildPortableProfile filters non-portable + expired", () => {
    const now = 2_000_000_000_000;
    const entries: MemoryEntry[] = [
      // portable, not expired
      { id: "1", primitiveId: "M2.ConversationalLongTerm", ownerId: "u-1", payload: {}, createdAt: now - 1000, expiresAt: now + 1000 },
      // non-portable
      { id: "2", primitiveId: "M1.ConversationalShortTerm", ownerId: "u-1", payload: {}, createdAt: now - 1000, expiresAt: now + 1000 },
      // portable, expired
      { id: "3", primitiveId: "M2.ConversationalLongTerm", ownerId: "u-1", payload: {}, createdAt: now - 10_000, expiresAt: now - 1 },
    ];
    const profile = buildPortableProfile("u-1", entries, now);
    expect(profile.entriesByPrimitive["M2.ConversationalLongTerm"]).toHaveLength(1);
    expect(profile.skipped).toHaveLength(2);
  });
  it("MP-9: buildPortableProfile skips entries belonging to other owners", () => {
    const entries: MemoryEntry[] = [
      { id: "a", primitiveId: "M2.ConversationalLongTerm", ownerId: "u-2", payload: {}, createdAt: 100, expiresAt: null },
    ];
    const profile = buildPortableProfile("u-1", entries);
    expect(profile.entriesByPrimitive["M2.ConversationalLongTerm"]).toHaveLength(0);
    // cross-owner entries are silently skipped (not in skipped list either; not relevant to owner)
    expect(profile.skipped).toHaveLength(0);
  });
  it("MP-10: planErasure includes erasable in-scope entries in willErase", () => {
    const entries: MemoryEntry[] = [
      { id: "a", primitiveId: "M2.ConversationalLongTerm", ownerId: "u-1", payload: {}, createdAt: 100, expiresAt: null },
      { id: "b", primitiveId: "M5.ClientContext", ownerId: "u-1", payload: {}, createdAt: 100, expiresAt: null },
    ];
    const plan = planErasure({ ownerId: "u-1", primitives: ["M2.ConversationalLongTerm", "M5.ClientContext"] }, entries);
    expect(plan.willErase).toHaveLength(2);
    expect(plan.willSkip).toHaveLength(0);
  });
  it("MP-11: planErasure skips M6 + M7 with non-erasable reason", () => {
    const entries: MemoryEntry[] = [
      { id: "a", primitiveId: "M6.RegulatoryEvidence", ownerId: "u-1", payload: {}, createdAt: 100, expiresAt: null },
      { id: "b", primitiveId: "M7.PerformanceMetrics", ownerId: "u-1", payload: {}, createdAt: 100, expiresAt: null },
    ];
    const plan = planErasure(
      { ownerId: "u-1", primitives: ["M6.RegulatoryEvidence", "M7.PerformanceMetrics"] },
      entries,
    );
    expect(plan.willErase).toHaveLength(0);
    expect(plan.willSkip.every((s) => s.reason === "non-erasable")).toBe(true);
  });
  it("MP-12: planErasure skips wrong-owner entries", () => {
    const entries: MemoryEntry[] = [
      { id: "a", primitiveId: "M2.ConversationalLongTerm", ownerId: "u-other", payload: {}, createdAt: 100, expiresAt: null },
    ];
    const plan = planErasure({ ownerId: "u-1", primitives: ["M2.ConversationalLongTerm"] }, entries);
    expect(plan.willErase).toHaveLength(0);
    expect(plan.willSkip[0].reason).toBe("wrong-owner");
  });
  it("MP-13: planErasure skips out-of-scope primitives", () => {
    const entries: MemoryEntry[] = [
      { id: "a", primitiveId: "M3.WorkflowState", ownerId: "u-1", payload: {}, createdAt: 100, expiresAt: null },
    ];
    const plan = planErasure({ ownerId: "u-1", primitives: ["M2.ConversationalLongTerm"] }, entries);
    expect(plan.willErase).toHaveLength(0);
    expect(plan.willSkip[0].reason).toBe("out-of-scope");
  });
});

describe("Wave D — M&V tracker", () => {
  it("MV-1: Day 1 -> 100% projection (cg1 cleared)", () => {
    const r = computeMeasuredSavings({ dayIndex: 1, projectedUsd: 100, empiricalUsd: 0, cg1: cleared });
    expect(r.empiricalWeight).toBe(0);
    expect(r.measuredSavingsUsd).toBe(100);
  });
  it("MV-2: Day 90 -> 100% empirical", () => {
    const r = computeMeasuredSavings({ dayIndex: 90, projectedUsd: 100, empiricalUsd: 50, cg1: cleared });
    expect(r.empiricalWeight).toBe(1);
    expect(r.measuredSavingsUsd).toBe(50);
  });
  it("MV-3: Mid-window blend", () => {
    const r = computeMeasuredSavings({ dayIndex: 45, projectedUsd: 100, empiricalUsd: 50, cg1: cleared });
    // Day 45 -> w = (45-1)/89 ≈ 0.494
    expect(r.empiricalWeight).toBeCloseTo(44 / 89, 5);
    // Blended = 100*(1-w) + 50*w
    expect(r.measuredSavingsUsd).toBeCloseTo(100 * (1 - 44 / 89) + 50 * (44 / 89), 5);
  });
  it("MV-4: CG-1 not cleared forces projection -> 0", () => {
    const r = computeMeasuredSavings({ dayIndex: 1, projectedUsd: 100, empiricalUsd: 0, cg1: pending });
    expect(r.cg1Forced).toBe(true);
    expect(r.measuredSavingsUsd).toBe(0);
  });
  it("MV-5: Negative blends are floored at 0", () => {
    const r = computeMeasuredSavings({ dayIndex: 90, projectedUsd: 0, empiricalUsd: -1000, cg1: cleared });
    expect(r.measuredSavingsUsd).toBe(0);
  });
  it("MV-6: aggregateMV sums correctly", () => {
    const rows = [
      { measuredSavingsUsd: 100, empiricalWeight: 0, cg1Forced: false },
      { measuredSavingsUsd: 50, empiricalWeight: 0.5, cg1Forced: false },
    ];
    const total = aggregateMV(rows);
    expect(total.measuredSavingsUsd).toBe(150);
    expect(total.sampleCount).toBe(2);
  });
});
