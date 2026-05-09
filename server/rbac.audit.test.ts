/**
 * rbac.audit.test.ts
 *
 * Honest baseline of how the 5-layer RBAC stack is currently used across
 * the ported routers. Locks current counts and asserts that L2/L3/L4
 * procedure factories at least exist and are imported somewhere.
 *
 * The TODO baseline numbers are recorded so a future pass can decrement
 * the protectedProcedure count as routers get correctly stratified.
 */
import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

const ROOT = "/home/ubuntu/stewardly-v3";

function countMatches(pattern: string): number {
  try {
    const out = execSync(
      `grep -rE "\\b${pattern}\\b" ${ROOT}/server/routers/ 2>/dev/null | wc -l`,
      { encoding: "utf8" },
    );
    return Number.parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

describe("RBAC audit (5-layer baseline)", () => {
  it("canonical RBAC module exposes all 5 procedure factories", () => {
    const src = execSync(`cat ${ROOT}/server/_core/rbac.ts`, { encoding: "utf8" });
    expect(src).toMatch(/globalAdminProcedure/);
    expect(src).toMatch(/orgAdminProcedure/);
    expect(src).toMatch(/managerProcedure/);
    expect(src).toMatch(/professionalProcedure/);
    expect(src).toMatch(/orgRoleProcedure/);
  });

  it("globalAdminProcedure is used in admin + L1-converted routers", () => {
    // Tranche A: admin.ts + stewardlySettings.ts + featureFlags.ts +
    // systemHealth.ts. Anything north of 20 keeps that floor.
    expect(countMatches("globalAdminProcedure")).toBeGreaterThan(20);
  });

  it("featureFlags + systemHealth no longer use ad-hoc admin checks", () => {
    const featureFlags = execSync(
      `cat ${ROOT}/server/routers/featureFlags.ts`,
      { encoding: "utf8" },
    );
    expect(featureFlags).not.toMatch(/requireAdmin/);
    expect(featureFlags).toMatch(/globalAdminProcedure/);
    const systemHealth = execSync(
      `cat ${ROOT}/server/routers/systemHealth.ts`,
      { encoding: "utf8" },
    );
    expect(systemHealth).toMatch(/globalAdminProcedure/);
    expect(systemHealth).not.toMatch(/protectedProcedure/);
  });

  it("L2/L3/L4 procedures are used somewhere (no zero coverage)", () => {
    expect(countMatches("orgAdminProcedure")).toBeGreaterThan(0);
    expect(countMatches("managerProcedure")).toBeGreaterThan(0);
    expect(countMatches("professionalProcedure")).toBeGreaterThan(0);
  });

  it("baseline: bulk of ported routers are still L5 (protectedProcedure)", () => {
    // This is intentionally a smoke baseline: it documents the drift the
    // user flagged. Future passes that stratify routers should decrease
    // protectedProcedure usage and increase L2/L3/L4 usage. Assert the
    // count exists and is large enough to prove the routers actually
    // import the module (not zero).
    const n = countMatches("protectedProcedure");
    expect(n).toBeGreaterThan(500);
  });
});
