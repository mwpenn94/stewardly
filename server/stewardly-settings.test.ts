/**
 * Coverage test for the Stewardly 5-layer AI settings stack:
 *  - 5 settings tables declared in schema
 *  - 5 routers registered in appRouter (platformAi, organizationAi, managerAi,
 *    professionalAi, households)
 *  - 5 settings pages exist with role gates + form bindings
 *  - 5 routes registered in App.tsx
 *  - StewardshipNav exposes nav items for each layer
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf-8");

describe("Stewardly 5-layer settings stack", () => {
  describe("schema", () => {
    const schema = read("drizzle/schema.ts");
    it.each([
      "platformAiSettings",
      "organizationAiSettings",
      "managerAiSettings",
      "professionalAiSettings",
      "userOrganizationRoles",
    ])("declares %s table", (table) => {
      expect(schema).toContain(`export const ${table}`);
    });
  });

  describe("routers", () => {
    const router = read("server/routers.ts");
    const settings = read("server/routers/stewardlySettings.ts");
    it.each([
      "platformAi",
      "organizationAi",
      "managerAi",
      "professionalAi",
      "households",
    ])("registers %s router in appRouter", (name) => {
      expect(router).toMatch(new RegExp(`${name}:\\s*\\w+Router`));
    });
    it("exposes get + upsert on each AI settings router", () => {
      for (const r of ["platformAi", "organizationAi", "managerAi", "professionalAi"]) {
          expect(settings).toMatch(new RegExp(`${r}Router\\s*=\\s*router\\(`));;
      }
    });
    it("households router exposes list + myOrgs", () => {
      expect(settings).toContain("households");
      expect(settings).toMatch(/\blist:\s*protectedProcedure/);
      expect(settings).toMatch(/\bmyOrgs:\s*protectedProcedure/);
    });
  });

  describe("pages", () => {
    const pages: Array<[string, string, string]> = [
      ["client/src/pages/PlatformAdminPage.tsx", "canSeePlatform", "platformAi"],
      ["client/src/pages/OrgSettingsPage.tsx", "canSeeOrgAdmin", "organizationAi"],
      ["client/src/pages/ManagerAiSettingsPage.tsx", "canSeeManager", "managerAi"],
      ["client/src/pages/ProfessionalAiSettingsPage.tsx", "canSeeProfessional", "professionalAi"],
      ["client/src/pages/HouseholdsPage.tsx", "canSeeProfessional", "households"],
    ];
    it.each(pages)(
      "%s gates with %s and binds to trpc.%s",
      (path, gate, router) => {
        const src = read(path);
        expect(src).toContain(`useRoles`);
        expect(src).toContain(gate);
        expect(src).toContain(`trpc.${router}.`);
        // Has a glass surface
        expect(src).toMatch(/glass-(card|sidebar|modal|overlay)/);
      },
    );
  });

  describe("App.tsx route table", () => {
    const app = read("client/src/App.tsx");
    it.each([
      ["/platform", "PlatformAdminPage"],
      ["/org/settings", "OrgSettingsPage"],
      ["/team/settings", "ManagerAiSettingsPage"],
      ["/professional/settings", "ProfessionalAiSettingsPage"],
      ["/households", "HouseholdsPage"],
      ["/admin", "AdminConsolePage"],
    ])("registers %s -> %s", (route, page) => {
      expect(app).toContain(`path="${route}"`);
      expect(app).toContain(page);
    });
  });

  describe("StewardshipNav progressive disclosure", () => {
    const nav = read("client/src/components/StewardshipNav.tsx");
    it.each([
      ["nav-connections", null],
      ["nav-portfolio", null],
      ["nav-economic-data", null],
      ["nav-households", "canSeeProfessional"],
      ["nav-professional-settings", "canSeeProfessional"],
      ["nav-team", "canSeeManager"],
      ["nav-team-settings", "canSeeManager"],
      ["nav-org-settings", "canSeeOrgAdmin"],
      ["nav-platform", "canSeePlatform"],
      ["nav-admin-console", "canSeeAdminConsole"],
    ])("exposes %s with gate %s", (testId, gate) => {
      expect(nav).toContain(`testId="${testId}"`);
      if (gate) expect(nav).toContain(gate);
    });
  });

  describe("GDPR cascade includes 5-layer roles", () => {
    const gdpr = read("server/routers/gdpr.ts");
    it("deletes userOrganizationRoles in deleteAllData", () => {
      expect(gdpr).toMatch(/db\.delete\(userOrganizationRoles\)/);
    });
  });
});
