/**
 * apps-router.test.ts
 *
 * Static invariants for the apps router and its schema:
 *   - userApps + appInstalls + appShareLinks tables are exported from drizzle/schema
 *   - server/routers/apps.ts exists and exports `appsRouter`
 *   - The router is mounted at appRouter.apps in server/routers.ts
 *   - All six expected procedures are present in the router source
 *
 * These are file-level checks (no DB roundtrip) so they can run quickly in
 * the CI hot path without requiring a live database.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

function read(rel: string): string {
  const p = resolve(ROOT, rel);
  if (!existsSync(p)) {
    throw new Error(`Expected file does not exist: ${rel}`);
  }
  return readFileSync(p, "utf8");
}

describe("apps router & schema invariants", () => {
  it("v3 schema.ts defines userApps, appInstalls, appShareLinks tables", () => {
    const schema = read("drizzle/schema.ts");
    expect(schema).toContain("export const userApps");
    expect(schema).toContain("export const appInstalls");
    expect(schema).toContain("export const appShareLinks");
    // And the underlying mysql table names
    expect(schema).toMatch(/mysqlTable\(\s*"user_apps"/);
    expect(schema).toMatch(/mysqlTable\(\s*"app_installs"/);
    expect(schema).toMatch(/mysqlTable\(\s*"app_share_links"/);
  });

  it("apps router file exists and exports appsRouter", () => {
    const router = read("server/routers/apps.ts");
    expect(router).toMatch(/export\s+const\s+appsRouter\s*=/);
  });

  it("appsRouter exposes the six core procedures", () => {
    const router = read("server/routers/apps.ts");
    const procedures = [
      "listInstalled",
      "browsePublic",
      "create",
      "installPublic",
      "installFromShareLink",
      "createShareLink",
      "setVisibility",
    ];
    for (const p of procedures) {
      // Procedures show up as `<name>: protectedProcedure` or `<name>: publicProcedure`
      const re = new RegExp(`^\\s*${p}:\\s*(protected|public)Procedure`, "m");
      expect(router).toMatch(re);
    }
  });

  it("server/routers.ts imports and mounts appsRouter at appRouter.apps", () => {
    const routers = read("server/routers.ts");
    expect(routers).toMatch(/import\s*\{\s*appsRouter\s*\}\s*from\s*["']\.\/routers\/apps["']/);
    // Mount line: `apps: appsRouter,`
    expect(routers).toMatch(/^\s*apps:\s*appsRouter,/m);
  });

  it("apps router uses v3's getDb helper (not the ai-ref db pattern)", () => {
    const router = read("server/routers/apps.ts");
    expect(router).toContain('from "../db"');
    expect(router).toContain("getDb");
    // Negative: should not import a non-existent ../core/db
    expect(router).not.toMatch(/from\s+["']\.\.\/_core\/db["']/);
  });

  it("AppLayout sidebar wires the Apps drawer to InstalledAppsList component", () => {
    const layout = read("client/src/components/AppLayout.tsx");
    expect(layout).toContain('from "@/components/sidebar/InstalledAppsList"');
    expect(layout).toMatch(/<InstalledAppsList\s+onNavigate=/);
    // The static placeholder string must be gone
    expect(layout).not.toContain("Apps you create or install will appear here.");
  });

  it("InstalledAppsList component calls trpc.apps.listInstalled and renders nav links", () => {
    const comp = read("client/src/components/sidebar/InstalledAppsList.tsx");
    expect(comp).toContain("trpc.apps.listInstalled.useQuery");
    expect(comp).toContain("/apps/${app.slug}");
    expect(comp).toMatch(/empty/i); // empty-state path is present
  });

  it("apps router validates inputs with zod and uses TRPCError for failures", () => {
    const router = read("server/routers/apps.ts");
    expect(router).toContain('import { z } from "zod"');
    expect(router).toContain('import { TRPCError } from "@trpc/server"');
    // Each mutation that touches a foreign resource should throw NOT_FOUND or FORBIDDEN
    expect(router).toContain('code: "NOT_FOUND"');
    expect(router).toContain('code: "FORBIDDEN"');
  });
});
