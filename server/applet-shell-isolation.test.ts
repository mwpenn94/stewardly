/**
 * Round 14.6 — Applet sidebar isolation tests.
 *
 * Each mission applet wrapper must:
 *   1. NOT import AppShell directly (no double-shell nesting).
 *   2. Pass `embedded` to every nested source hub it renders.
 *
 * Each source hub used by an applet must:
 *   1. Accept an optional `embedded` prop in its default export signature.
 *   2. Use a `Shell` indirection so AppShell is bypassed when embedded.
 *
 * Hub.ts must point Contextual tile to /contextual (the embedded route),
 * not to /intelligence-hub/* (the source-faithful unembedded route).
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("applet shell isolation (Round 14.6)", () => {
  it("RelationalApplet does not import AppShell and passes embedded to nested hubs", () => {
    const src = read("client/src/pages/RelationalApplet.tsx");
    expect(src).not.toMatch(/from "@\/components\/AppShell"/);
    expect(src).toMatch(/<PeopleHub embedded/);
    expect(src).toMatch(/<Organizations embedded/);
    expect(src).toMatch(/<ManagerDashboard embedded/);
  });

  it("ContinuousImprovementApplet does not import AppShell and passes embedded", () => {
    const src = read("client/src/pages/ContinuousImprovementApplet.tsx");
    expect(src).not.toMatch(/from "@\/components\/AppShell"/);
    expect(src).toMatch(/<ImprovementDashboard embedded/);
    expect(src).toMatch(/<ImprovementEngine embedded/);
    expect(src).toMatch(/<AdminSystemHealth embedded/);
    expect(src).toMatch(/<AdminAuditTrail embedded/);
    expect(src).toMatch(/<FairnessTestDashboard embedded/);
    expect(src).toMatch(/<ComplianceAudit embedded/);
  });

  describe.each([
    ["client/src/pages/PeopleHub.tsx", "PeopleHub"],
    ["client/src/pages/Organizations.tsx", "Organizations"],
    ["client/src/pages/ManagerDashboard.tsx", "ManagerDashboard"],
    ["client/src/pages/IntelligenceHubV2.tsx", "IntelligenceHubV2"],
    ["client/src/pages/Calculators.tsx", "Calculators"],
    ["client/src/pages/ImprovementDashboard.tsx", "ImprovementDashboard"],
    ["client/src/components/LearningShell.tsx", "LearningShell"],
  ])("%s accepts embedded prop and uses Shell indirection", (file, name) => {
    it(`${name} signature accepts embedded`, () => {
      const src = read(file);
      expect(src).toMatch(/embedded\s*=\s*false/);
      expect(src).toMatch(/const\s+Shell\s*=\s*embedded\s*\?/);
      // Should not have any raw <AppShell ...> JSX usages outside the
      // import line and the Shell ternary fallback.
      const jsxAppShell = src.match(/<AppShell[\s\n]/g) ?? [];
      expect(jsxAppShell.length).toBe(0);
    });
  });

  it("LearningHome forwards embedded prop to LearningShell", () => {
    const src = read("client/src/pages/learning/LearningHome.tsx");
    expect(src).toMatch(/embedded\s*=\s*false/);
    expect(src).toMatch(/<LearningShell title="Learning" embedded=\{embedded\}>/);
  });

  it("App.tsx mounts the 5 mission applets with embedded where appropriate", () => {
    const src = read("client/src/App.tsx");
    // /formational, /missional/wealth, /contextual all wrap source hubs directly.
    expect(src).toMatch(/<LearningHome embedded \/>/);
    expect(src).toMatch(/<CalculatorsPage embedded \/>/);
    expect(src).toMatch(/<IntelligenceHubV2 embedded \/>/);
  });

  it("Hub Contextual tile points to /contextual (embedded route), not /intelligence-hub/overview", () => {
    const src = read("server/routers/hub.ts");
    expect(src).toMatch(/builtinId:\s*"engine:contextual"[^}]*path:\s*"\/contextual"/);
    expect(src).not.toMatch(/builtinId:\s*"engine:contextual"[^}]*path:\s*"\/intelligence-hub/);
  });
});
