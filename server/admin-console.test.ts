/**
 * server/admin-console.test.ts
 *
 * Coverage for the cross-layer Admin Console: admin router shape +
 * tenant management page wiring.
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");
const r = (p: string) => path.join(ROOT, p);

describe("Admin router (server/routers/admin.ts)", () => {
  const file = r("server/routers/admin.ts");
  it("exists", () => expect(existsSync(file)).toBe(true));

  const src = existsSync(file) ? readFileSync(file, "utf8") : "";

  it("exposes all expected procedures (incl. white-label + L2 roll-up + L1 API keys)", () => {
    for (const proc of [
      "listTenants", "tenantMembers", "upsertMember", "removeMember",
      "listUsers", "userSummary",
      "tenantBranding", "updateTenantBranding", "orgRollup",
      "listApiKeys", "issueApiKey", "revokeApiKey",
    ]) {
      expect(src).toMatch(new RegExp(`${proc}:\\s+globalAdminProcedure`));
    }
  });

  it("issueApiKey hashes plaintext via sha256 (not stored raw)", () => {
    expect(src).toContain("createHash(\"sha256\")");
    expect(src).toContain("keyHash");
    expect(src).toContain("keyPrefix");
  });

  it("updateTenantBranding accepts logoUrl/customDomain/themeColor", () => {
    expect(src).toMatch(/logoUrl:\s*z\.string\(\)\.url/);
    expect(src).toMatch(/customDomain:\s*z\n?\s*\.string\(\)/);
    expect(src).toContain("themeColor");
  });

  it("uses globalAdminProcedure (L1 only) for every mutation", () => {
    expect(src).toContain("globalAdminProcedure");
    // Make sure no procedure leaks through publicProcedure.
    expect(src).not.toContain("publicProcedure");
  });

  it("queries the integration tables for the user-summary tile", () => {
    for (const tbl of ["plaidItems", "snapTradeBrokerageConnections", "snapTradeAccounts", "snapTradePositions", "integrationConnections"]) {
      expect(src).toContain(tbl);
    }
  });

  it("is registered in appRouter", () => {
    const routers = readFileSync(r("server/routers.ts"), "utf8");
    expect(routers).toContain('import { adminRouter } from "./routers/admin"');
    expect(routers).toMatch(/admin:\s+adminRouter/);
  });
});

describe("AdminConsolePage (live tiles)", () => {
  const file = r("client/src/pages/AdminConsolePage.tsx");
  it("exists", () => expect(existsSync(file)).toBe(true));

  const src = existsSync(file) ? readFileSync(file, "utf8") : "";

  it("calls admin.listTenants for the Tenants tile", () => {
    expect(src).toContain("admin.listTenants.useQuery");
  });

  it("calls admin.listUsers + admin.userSummary for GDPR ops tile", () => {
    expect(src).toContain("admin.listUsers.useQuery");
    expect(src).toContain("admin.userSummary.useQuery");
  });

  it("renders the L1 API keys tile with issue + revoke + scope picker", () => {
    expect(src).toContain('admin.listApiKeys.useQuery');
    expect(src).toContain('admin.issueApiKey.useMutation');
    expect(src).toContain('admin.revokeApiKey.useMutation');
    expect(src).toContain('data-testid="apikeys-tile"');
    expect(src).toContain('data-testid="apikey-issue"');
    // Template literal `apikey-scope-${s.value}` — assert the static
    // prefix and the four scope strings appear somewhere in the file.
    expect(src).toContain("apikey-scope-");
    for (const s of ["read:engines", "read:economic-data", "read:portfolio", "read:households"]) {
      expect(src).toContain(s);
    }
  });

  it("renders engine tools and adapter status (existing live tiles)", () => {
    expect(src).toContain("engines.toolsList.useQuery");
    expect(src).toContain("financialData.status.useQuery");
  });

  it("links to /admin/tenants/:id for drill-down", () => {
    expect(src).toMatch(/href=\{`\/admin\/tenants\/\$\{t\.id\}`\}/);
  });

  it("uses the canSeeAdminConsole role gate", () => {
    expect(src).toContain("canSeeAdminConsole");
  });
});

describe("TenantManagePage", () => {
  const file = r("client/src/pages/TenantManagePage.tsx");
  it("exists", () => expect(existsSync(file)).toBe(true));

  const src = existsSync(file) ? readFileSync(file, "utf8") : "";

  it("matches the /admin/tenants/:orgId route", () => {
    expect(src).toContain('/admin/tenants/:orgId');
  });

  it("calls admin.tenantMembers + admin.upsertMember + admin.removeMember", () => {
    expect(src).toContain("admin.tenantMembers.useQuery");
    expect(src).toContain("admin.upsertMember.useMutation");
    expect(src).toContain("admin.removeMember.useMutation");
  });

  it("offers all 4 organization roles in the picker", () => {
    expect(src).toMatch(/ORG_ROLES\s*=\s*\["user", "professional", "manager", "org_admin"\]/);
  });

  it("guards the page with canSeeAdminConsole", () => {
    expect(src).toContain("canSeeAdminConsole");
  });

  it("is registered in App.tsx", () => {
    const app = readFileSync(r("client/src/App.tsx"), "utf8");
    expect(app).toContain('import("./pages/TenantManagePage")');
    expect(app).toContain('path="/admin/tenants/:orgId"');
  });

  it("renders the L2 multi-household roll-up tile", () => {
    expect(src).toContain('admin.orgRollup.useQuery');
    expect(src).toContain('data-testid="tenant-rollup-tile"');
  });

  it("renders the L1 white-label tile with all three inputs", () => {
    expect(src).toContain('admin.tenantBranding.useQuery');
    expect(src).toContain('admin.updateTenantBranding.useMutation');
    expect(src).toContain('data-testid="tenant-logo-url"');
    expect(src).toContain('data-testid="tenant-custom-domain"');
    expect(src).toContain('data-testid="tenant-theme-color"');
  });
});

describe("HouseholdDetailPage (L4 drill-down)", () => {
  const file = r("client/src/pages/HouseholdDetailPage.tsx");
  it("exists", () => expect(existsSync(file)).toBe(true));

  const src = existsSync(file) ? readFileSync(file, "utf8") : "";

  it("matches the /households/:userId route and registers in App.tsx", () => {
    expect(src).toContain('/households/:userId');
    const app = readFileSync(r("client/src/App.tsx"), "utf8");
    expect(app).toContain('import("./pages/HouseholdDetailPage")');
    expect(app).toContain('path="/households/:userId"');
  });

  it("calls households.getOne + engines.toolsList/Invoke", () => {
    expect(src).toContain('households.getOne.useQuery');
    expect(src).toContain('engines.toolsList.useQuery');
    expect(src).toContain('engines.toolsInvoke.useMutation');
  });

  it("gates by canSeeProfessional", () => {
    expect(src).toContain('canSeeProfessional');
  });

  it("renders all 4 engine families with visible/toolName plumbing", () => {
    expect(src).toMatch(/family:\s*"uwe"/);
    expect(src).toMatch(/family:\s*"bie"/);
    expect(src).toMatch(/family:\s*"he"/);
    expect(src).toMatch(/family:\s*"scui"/);
    // testid is templated `run-engine-${b.family}` so verify the prefix exists.
    expect(src).toContain('`run-engine-${b.family}`');
  });

  it("HouseholdsPage row links to drill-down", () => {
    const list = readFileSync(r("client/src/pages/HouseholdsPage.tsx"), "utf8");
    expect(list).toMatch(/href=\{`\/households\/\$\{h\.id\}`\}/);
  });
});

describe("households.getOne (per-household drill-down procedure)", () => {
  const file = r("server/routers/stewardlySettings.ts");
  const src = existsSync(file) ? readFileSync(file, "utf8") : "";

  it("is declared as a protectedProcedure that takes userId", () => {
    expect(src).toMatch(/getOne:\s+protectedProcedure/);
    expect(src).toMatch(/userId:\s*z\.number\(\)\.int\(\)\.positive\(\)/);
  });

  it("enforces FORBIDDEN when caller has no scope on the user", () => {
    expect(src).toContain('FORBIDDEN');
    expect(src).toContain('household not accessible at your layer');
  });

  it("returns integrations rolled up across plaid + snaptrade tables", () => {
    for (const tbl of ["plaidItems", "snapTradeAccounts", "snapTradePositions"]) {
      expect(src).toContain(tbl);
    }
    expect(src).toMatch(/totalAum/);
  });
});
