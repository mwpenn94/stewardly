/**
 * engine-taxonomy.test.ts — locks the canonical 5-engine taxonomy
 * (Section 3) so a future refactor can't silently rename, reorder,
 * or drop an engine without breaking this test.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("Canonical 5-engine taxonomy", () => {
  const taxonomy = read("shared/engineTaxonomy.ts");
  const sidebar = read("client/src/components/StewardshipNav.tsx");
  const app = read("client/src/App.tsx");
  const hub = read("client/src/pages/EngineHubPage.tsx");

  describe("shared/engineTaxonomy.ts is the single source of truth", () => {
    it.each([
      "formational",
      "relational",
      "missional",
      "contextual",
      "continuous-improvement",
    ])("declares engine id '%s'", (id) => {
      expect(taxonomy).toContain(`id: "${id}"`);
    });

    it("declares Wealth as a mission inside Missional, not a peer engine", () => {
      // Wealth should appear as a mission under missional, not as a top-level engine
      expect(taxonomy).toMatch(/missions:\s*\[[\s\S]*?slug:\s*["']wealth["']/);
      expect(taxonomy).not.toMatch(/id:\s*["']wealth["']/);
    });

    it("exposes visibleEnginesFor + Role + EngineDef contract", () => {
      expect(taxonomy).toContain("export function visibleEnginesFor");
      expect(taxonomy).toMatch(/export\s+(type|interface)\s+Role\b/);
      expect(taxonomy).toMatch(/export\s+(type|interface)\s+EngineDef\b/);
    });
  });

  describe("StewardshipNav consumes the taxonomy", () => {
    it("imports visibleEnginesFor from @shared/engineTaxonomy", () => {
      expect(sidebar).toMatch(/visibleEnginesFor[\s\S]*?@shared\/engineTaxonomy/);
    });
    it("does not render persona-layer label headers (per user guidance)", () => {
      // No literal persona headings in the sidebar source
      expect(sidebar).not.toMatch(/\bPERSONAL\b|\bPROFESSIONAL\b|\bLEADERSHIP\b|\bPLATFORM\b/);
    });
  });

  describe("App.tsx registers all 5 engine hub routes + legacy redirects", () => {
    it.each([
      "/formational",
      "/relational",
      "/missional",
      "/missional/wealth",
      "/contextual",
      "/continuous-improvement",
    ])("registers canonical engine route %s", (path) => {
      expect(app).toContain(`path="${path}"`);
    });

    it.each([
      "/wealth-engine",
      "/learning",
      "/people",
      "/intelligence-hub",
    ])("preserves legacy URL %s as additive redirect", (path) => {
      expect(app).toContain(`path="${path}"`);
    });

    it("imports EngineHubPage", () => {
      expect(app).toContain('import("./pages/EngineHubPage")');
    });
  });

  describe("EngineHubPage renders glass-card + taxonomy-driven content", () => {
    it("imports the taxonomy", () => {
      expect(hub).toMatch(/from\s+["']@shared\/engineTaxonomy["']/);
    });
    it("uses glass-card + marble-bg utilities", () => {
      expect(hub).toContain("glass-card");
      expect(hub).toContain("marble-bg");
    });
    it("renders a Restricted state when role gate fails", () => {
      expect(hub).toContain("Restricted");
    });
  });
});
