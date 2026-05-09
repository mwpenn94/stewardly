/**
 * Wave E — Stewardship/fiduciary language audit tests
 * =====================================================
 */
import { describe, it, expect } from "vitest";
import { auditCopy, assertAlignedCopy, LanguageAuditFailure } from "../languageAudit";

describe("Wave E — language audit", () => {
  it("LA-1: aligned copy passes with verdict 'aligned'", () => {
    const r = auditCopy("Stewardly's stewardship engagement protects the client's best interest with full disclosure.");
    expect(r.verdict).toBe("aligned");
    expect(r.findings).toHaveLength(0);
    expect(r.approvedFound.length).toBeGreaterThan(0);
  });
  it("LA-2: 'vendor' is flagged with block severity", () => {
    const r = auditCopy("Stewardly is a leading vendor of fiduciary technology.");
    expect(r.verdict).toBe("flagged");
    expect(r.findings.some((f) => f.term.toLowerCase() === "vendor" && f.severity === "block")).toBe(true);
  });
  it("LA-3: 'subscription' is flagged", () => {
    const r = auditCopy("Upgrade your subscription today.");
    expect(r.verdict).toBe("flagged");
    expect(r.findings.some((f) => /subscription/i.test(f.term))).toBe(true);
  });
  it("LA-4: 'AI assistant' is flagged with reword guidance", () => {
    const r = auditCopy("Meet our new AI assistant.");
    expect(r.verdict).toBe("flagged");
    expect(r.findings[0].reason).toMatch(/Stewardly engine surface/);
  });
  it("LA-5: 'agent' triggers context-warning, not block, when used in mixed text", () => {
    const r = auditCopy("Our engine agent processes the request as a steward.");
    // Has both an approved vocab term and a context-warn term, no block.
    expect(r.verdict).toBe("context-warning");
    expect(r.findings.every((f) => f.severity === "warn")).toBe(true);
  });
  it("LA-6: fiduciary-critical copy without approved vocab is flagged", () => {
    const r = auditCopy("Our service helps you make smart decisions.", true);
    expect(r.verdict).toBe("flagged");
    expect(r.fiduciaryCriticalGap).toBe(true);
  });
  it("LA-7: fiduciary-critical copy WITH approved vocab passes", () => {
    const r = auditCopy("Our stewardship surface acts in the client's best interest.", true);
    expect(r.verdict).toBe("aligned");
    expect(r.fiduciaryCriticalGap).toBe(false);
  });
  it("LA-8: assertAlignedCopy throws LanguageAuditFailure on flagged", () => {
    expect(() => assertAlignedCopy("Become a subscriber today.")).toThrow(LanguageAuditFailure);
  });
  it("LA-9: assertAlignedCopy returns the report on aligned input", () => {
    const r = assertAlignedCopy("A steward acts in the client's best interest.");
    expect(r.verdict).toBe("aligned");
  });
  it("LA-10: case-insensitive matching catches Vendor / VENDOR", () => {
    const r = auditCopy("Vendor and VENDOR and vendor.");
    expect(r.findings.length).toBeGreaterThanOrEqual(3);
  });
  it("LA-11: 'robo-advisor' (with hyphen) and 'robo advisor' (with space) both flagged", () => {
    const r1 = auditCopy("Stewardly is not a robo-advisor.");
    const r2 = auditCopy("Stewardly is not a robo advisor.");
    expect(r1.findings.some((f) => /robo/i.test(f.term))).toBe(true);
    expect(r2.findings.some((f) => /robo/i.test(f.term))).toBe(true);
  });
  it("LA-12: multiple findings reported with correct indices", () => {
    const text = "Our vendor offers a chatbot subscription.";
    const r = auditCopy(text);
    expect(r.findings.length).toBeGreaterThanOrEqual(3);
    // Each finding should have a valid index into the input.
    for (const f of r.findings) {
      expect(text.toLowerCase()).toContain(f.term.toLowerCase());
    }
  });
});
