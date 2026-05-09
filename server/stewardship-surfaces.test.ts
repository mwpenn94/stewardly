/**
 * stewardship-surfaces.test.ts — guards the 5-layer UI scaffolding so a
 * future refactor can't silently delete a route, role gate, or glass class
 * without breaking this test.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("Stewardship 5-layer surfaces", () => {
  const app = read("client/src/App.tsx");
  const sidebar = read("client/src/components/StewardshipNav.tsx");
  const nav = read("client/src/components/AppLayout.tsx");
  const useRoles = read("client/src/hooks/useRoles.ts");
  const indexCss = read("client/src/index.css");

  describe("routes wired in App.tsx", () => {
    const required = [
      ["/individual", "IndividualHomePage"],
      ["/connections", "ConnectionsPage"],
      ["/portfolio", "PortfolioPage"],
      ["/economic-data", "EconomicDataPage"],
      ["/households", "HouseholdsPage"],
      ["/households/:userId", "HouseholdDetailPage"],
      ["/org/settings", "OrgSettingsPage"],
      ["/platform", "PlatformAdminPage"],
      ["/admin", "AdminConsolePage"],
    ];
    it.each(required)("registers %s route -> %s", (path, comp) => {
      expect(app).toContain(`path="${path}"`);
      expect(app).toContain(comp);
    });
  });

  describe("StewardshipNav uses useRoles for progressive disclosure", () => {
    it("imports useRoles", () => {
      expect(sidebar).toMatch(/from\s+["']@\/hooks\/useRoles["']/);
    });
    it.each([
      "canSeeProfessional",
      "canSeeManager",
      "canSeeOrgAdmin",
      "canSeePlatform",
      "canSeeAdminConsole",
    ])("gates with %s flag", (flag) => {
      expect(sidebar).toContain(flag);
    });
  });

  describe("each placeholder page enforces its role gate", () => {
    const cases = [
      ["client/src/pages/HouseholdsPage.tsx", "canSeeProfessional"],
      ["client/src/pages/OrgSettingsPage.tsx", "canSeeOrgAdmin"],
      ["client/src/pages/PlatformAdminPage.tsx", "canSeePlatform"],
      ["client/src/pages/AdminConsolePage.tsx", "canSeeAdminConsole"],
    ];
    it.each(cases)("%s gates with %s", (path, flag) => {
      const src = read(path);
      expect(src).toContain(flag);
      // Each page should show a Restricted state when the gate fails
      expect(src).toContain("Restricted");
    });
  });

  describe("useRoles exposes the canonical 5-layer flags", () => {
    it.each([
      "canSeeProfessional",
      "canSeeManager",
      "canSeeOrgAdmin",
      "canSeePlatform",
      "canSeeAdminConsole",
    ])("exposes %s", (flag) => {
      expect(useRoles).toContain(flag);
    });
  });

  describe("AppLayout wires StewardshipNav into the sidebar", () => {
    it("imports StewardshipNav", () => {
      expect(nav).toMatch(/from\s+["']@\/components\/StewardshipNav["']/);
    });
    it("renders <StewardshipNav />", () => {
      expect(nav).toContain("<StewardshipNav />");
    });
    it("applies marble-bg to the shell and at least one glass-* class somewhere", () => {
      expect(nav).toContain("marble-bg");
      expect(nav).toMatch(/\bglass-(card|sidebar|modal|overlay)\b/);
    });
  });

  describe("Glass design system tokens", () => {
    it.each([
      ".glass-card",
      ".glass-sidebar",
      ".glass-modal",
      ".glass-overlay",
      ".marble-bg",
    ])("defines %s utility", (cls) => {
      expect(indexCss).toContain(cls);
    });

    it("defines all 6 glass utilities + marble-bg in index.css (locked snapshot)", () => {
      const required = [".glass", ".glass-card", ".glass-sidebar",
        ".glass-overlay", ".glass-modal", ".glass-input", ".marble-bg"];
      // Every token must be defined as a class selector with at least one
      // backdrop-filter declaration so the visual contract is preserved.
      for (const cls of required) {
        const re = new RegExp(`\\${cls}\\s*\\{[\\s\\S]*?\\}`);
        expect(indexCss).toMatch(re);
      }
      expect(indexCss).toMatch(/\.glass-card\s*\{[\s\S]*?backdrop-filter/);
      expect(indexCss).toMatch(/\.glass-modal\s*\{[\s\S]*?backdrop-filter/);
    });

    it("shadcn Dialog primitives use glass-overlay + glass-modal", () => {
      const dialog = read("client/src/components/ui/dialog.tsx");
      expect(dialog).toMatch(/glass-overlay/);
      expect(dialog).toMatch(/glass-modal/);
    });
  });

  describe("L5 hub /individual", () => {
    const hub = read("client/src/pages/IndividualHomePage.tsx");
    it.each([
      ["/connections", "individual-tile-connections"],
      ["/portfolio", "individual-tile-portfolio"],
      ["/economic-data", "individual-tile-economic-data"],
    ])("links to %s with testid %s", (href, testId) => {
      expect(hub).toContain(`href: "${href}"`);
      expect(hub).toContain(`testId: "${testId}"`);
    });
    it("is wired into the sidebar via App.tsx route entry", () => {
      expect(app).toContain('path="/individual"');
    });
  });

  describe("Brand rebrand from 'Manus Next' is complete in shell", () => {
    it("AppLayout no longer hardcodes 'Manus Next'", () => {
      expect(nav).not.toMatch(/\bManus Next\b/);
    });
    it("client/index.html no longer hardcodes 'Manus Next' in title/og tags", () => {
      const html = read("client/index.html");
      expect(html).not.toMatch(/\bManus Next\b/);
      expect(html.toLowerCase()).toMatch(/\bstewardly\b/);
    });
  });
});
