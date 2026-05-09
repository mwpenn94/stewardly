import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ENGINES } from "../shared/engineTaxonomy";

/**
 * Round 11 (2026-05) — Source-inheritance parity tests.
 *
 * Every leaf declared in `shared/engineTaxonomy.ts` must resolve to a
 * registered route in `client/src/App.tsx`. The taxonomy is the
 * customer-facing manifest; if a leaf appears there but no route is
 * registered, users hit a 404. CI fails before deploy in that case.
 */

const APP_TSX = readFileSync(
  resolve(__dirname, "../client/src/App.tsx"),
  "utf-8",
);

/** Every leaf path declared anywhere in the taxonomy. */
function collectAllLeafPaths(): string[] {
  const out = new Set<string>();
  for (const engine of ENGINES) {
    for (const leaf of engine.leaves ?? []) out.add(leaf.path);
    for (const m of engine.missions ?? []) {
      for (const leaf of m.leaves) out.add(leaf.path);
    }
  }
  return [...out];
}

/**
 * Returns true if App.tsx registers a route for the given path.
 */
function hasRoute(path: string): boolean {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`path="${escaped}"`).test(APP_TSX);
}

describe("Engine taxonomy → App.tsx parity (Round 11 source inheritance)", () => {
  it("registers a route for every leaf path declared in engineTaxonomy", () => {
    const missing: string[] = [];
    for (const path of collectAllLeafPaths()) {
      if (!hasRoute(path)) missing.push(path);
    }
    expect(
      missing,
      `Taxonomy leaves missing from App.tsx routing:\n${missing.join("\n")}`,
    ).toEqual([]);
  });

  it("registers all 5 engine hub roots", () => {
    for (const engine of ENGINES) {
      expect(hasRoute(engine.path), `engine ${engine.id} hub route missing`).toBe(true);
    }
  });

  it("uses static lazy imports (no runtime require)", () => {
    expect(APP_TSX).not.toMatch(/require\(["']@\/pages\//);
  });

  it("AuthProvider is mounted in App.tsx so context-bound useAuth callers don't throw", () => {
    expect(APP_TSX, "AuthProvider must wrap the application tree").toContain("<AuthProvider>");
    expect(APP_TSX).toContain("</AuthProvider>");
  });
});

describe("Source-app inheritance: every canonical engine page is taxonomy-reachable", () => {
  /**
   * Canonical source pages that MUST be reachable through the engine
   * taxonomy. If a page is removed from the taxonomy, it disappears
   * from the sidebar/Apps menu — these are the source-inherited pages
   * the user explicitly asked to keep within the 5 engine apps.
   */
  const SOURCE_REQUIRED: Record<string, string> = {
    // Formational
    "/learning": "formational",
    "/learning/tracks": "formational",
    "/learning/studio": "formational",
    "/learning/cases": "formational",
    "/learning/achievements": "formational",
    "/learning/leaderboard": "formational",
    "/proficiency": "formational",
    "/welcome": "formational",
    "/help": "formational",
    "/changelog": "formational",
    // Relational
    "/people": "relational",
    "/organizations": "relational",
    "/portal": "relational",
    "/portal-analytics": "relational",
    "/email-campaigns": "relational",
    "/outreach-automation": "relational",
    "/relationships": "relational",
    "/team": "relational",
    "/org-branding": "relational",
    // Missional
    "/calculators": "missional",
    "/wealth-engine": "missional",
    "/portfolio-risk": "missional",
    "/products": "missional",
    "/tax-planning": "missional",
    "/estate": "missional",
    "/insurance-analysis": "missional",
    "/financial-twin": "missional",
    "/financial-planning": "missional",
    "/operations": "missional",
    "/advisory": "missional",
    "/workflows": "missional",
    "/business-exit": "missional",
    "/annual-review": "missional",
    "/compliance-copilot": "missional",
    "/tax-projector": "missional",
    "/marketing-assets": "missional",
    "/premium-finance-rates": "missional",
    // Contextual
    "/intelligence-hub": "contextual",
    "/market-data": "contextual",
    "/data-pipelines": "contextual",
    "/sovereign-study": "contextual",
    // Optimal (continuous-improvement)
    "/admin": "continuous-improvement",
    "/manager": "continuous-improvement",
    "/admin/improvement-engine": "continuous-improvement",
    "/admin/api-keys": "continuous-improvement",
    "/admin/system-health": "continuous-improvement",
    "/admin/audit-trail": "continuous-improvement",
    "/admin/team": "continuous-improvement",
    "/admin/billing": "continuous-improvement",
    "/admin/guide": "continuous-improvement",
    "/integrations": "continuous-improvement",
    "/integration-health": "continuous-improvement",
    "/sync-dashboard": "continuous-improvement",
    "/permissions": "continuous-improvement",
    "/api-docs": "continuous-improvement",
    "/command-center": "continuous-improvement",
    "/manus-next": "continuous-improvement",
  };

  it("declares every canonical source page under the right engine", () => {
    const taxonomyPaths = new Map<string, string>();
    for (const engine of ENGINES) {
      for (const leaf of engine.leaves ?? []) taxonomyPaths.set(leaf.path, engine.id);
      for (const m of engine.missions ?? []) {
        for (const leaf of m.leaves) taxonomyPaths.set(leaf.path, engine.id);
      }
    }
    const wrong: string[] = [];
    for (const [path, expectedEngine] of Object.entries(SOURCE_REQUIRED)) {
      const actual = taxonomyPaths.get(path);
      if (!actual) {
        wrong.push(`MISSING: ${path} (expected under ${expectedEngine})`);
      } else if (actual !== expectedEngine) {
        wrong.push(`WRONG ENGINE: ${path} is under ${actual}, expected ${expectedEngine}`);
      }
    }
    expect(wrong, `Source-inheritance violations:\n${wrong.join("\n")}`).toEqual([]);
  });
});
