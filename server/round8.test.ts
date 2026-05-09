/**
 * Round 8 invariants — Hub builtin drag fix + source-of-truth alignment with
 * mwpenn94/stewardly-ai. Locks:
 *   1. Every invented stub page I scaffolded without instruction is DELETED.
 *   2. Every source page that backs a kept engine leaf is PORTED into v3.
 *   3. App.tsx no longer references the deleted invented pages or routes.
 *   4. EngineTaxonomy.ts no longer lists the 6 removed leaves.
 *   5. Hub.tsx's reorder handler no longer short-circuits on builtin drags
 *      (i.e. builtin tiles ARE user-reorderable now).
 *   6. The localStorage-backed builtin order key + setter both exist in Hub.tsx.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const repo = resolve(__dirname, "..");
const read = (p: string) => readFileSync(resolve(repo, p), "utf8");
const exists = (p: string) => existsSync(resolve(repo, p));

describe("Round 8 — invented stub pages removed", () => {
  const removed = [
    "client/src/pages/HouseholdsPage.tsx",
    "client/src/pages/HouseholdDetailPage.tsx",
    "client/src/pages/ConnectionsPage.tsx",
    "client/src/pages/EconomicDataPage.tsx",
    "client/src/pages/DocumentStudioPage.tsx",
    "client/src/pages/AdminConsolePage.tsx",
  ];
  for (const p of removed) {
    it(`${p} no longer exists on disk`, () => {
      expect(exists(p)).toBe(false);
    });
  }
});

describe("Round 8 — source pages ported in", () => {
  const ported = [
    "client/src/pages/MyFinancialTwin.tsx",
    "client/src/pages/AdminHubV2.tsx",
    "client/src/pages/AdminAuditTrail.tsx",
    "client/src/pages/AdminSystemHealth.tsx",
    "client/src/pages/learning/TracksIndex.tsx",
  ];
  for (const p of ported) {
    it(`${p} is present in v3`, () => {
      expect(exists(p)).toBe(true);
      expect(read(p).length).toBeGreaterThan(500);
    });
  }
});

describe("Round 8 — App.tsx no longer references deleted invented pages", () => {
  const app = read("client/src/App.tsx");
  it("no lazy import for HouseholdsPage", () => {
    expect(app).not.toMatch(/import\(["']\.\/pages\/HouseholdsPage["']\)/);
  });
  it("no lazy import for HouseholdDetailPage", () => {
    expect(app).not.toMatch(/import\(["']\.\/pages\/HouseholdDetailPage["']\)/);
  });
  it("no lazy import for EconomicDataPage", () => {
    expect(app).not.toMatch(/import\(["']\.\/pages\/EconomicDataPage["']\)/);
  });
  it("no lazy import for the v3 DocumentStudioPage stub", () => {
    expect(app).not.toMatch(/import\(["']\.\/pages\/DocumentStudioPage["']\)/);
  });
  it("no lazy import for the v3 AdminConsolePage stub", () => {
    expect(app).not.toMatch(/import\(["']\.\/pages\/AdminConsolePage["']\)/);
  });
  it("ConnectionsPage import (if kept) points to Integrations source page, not the deleted v3 stub", () => {
    // ConnectionsPagePort is the alias used; allowed when it points to ./pages/Integrations.
    const m = app.match(/ConnectionsPagePort\s*=\s*lazy\(\(\)\s*=>\s*import\(["']([^"']+)["']\)\)/);
    if (m) expect(m[1]).toBe("./pages/Integrations");
  });
  it("references the ported MyFinancialTwin page", () => {
    expect(app).toMatch(/import\(["']\.\/pages\/MyFinancialTwin["']\)/);
  });
  it("references the ported AdminHubV2 page", () => {
    expect(app).toMatch(/import\(["']\.\/pages\/AdminHubV2["']\)/);
  });
  it("references the ported AdminAuditTrail page", () => {
    expect(app).toMatch(/import\(["']\.\/pages\/AdminAuditTrail["']\)/);
  });
  it("references the ported AdminSystemHealth page", () => {
    expect(app).toMatch(/import\(["']\.\/pages\/AdminSystemHealth["']\)/);
  });
  it("references the ported learning/TracksIndex page", () => {
    expect(app).toMatch(/import\(["']\.\/pages\/learning\/TracksIndex["']\)/);
  });
});

describe("Round 8 — engineTaxonomy no longer lists the 6 removed leaves", () => {
  const tax = read("shared/engineTaxonomy.ts");
  const removedPaths = [
    "/relational/households",
    "/relational/conversations",
    "/contextual/economic-data",
    "/contextual/memory",
    "/contextual/documents",
    "/formational/studio",
  ];
  for (const p of removedPaths) {
    it(`taxonomy does not list "${p}"`, () => {
      expect(tax).not.toMatch(new RegExp(`path:\\s*"${p}"`));
    });
  }
});

describe("Round 8 — Hub builtin drag is now wired", () => {
  const hub = read("client/src/pages/Hub.tsx");
  it("Hub.tsx no longer contains the 'builtins are not user-reorderable' short-circuit", () => {
    expect(hub).not.toMatch(/builtins are not user-reorderable/);
  });
  it("Hub.tsx defines a per-user localStorage key for builtin order", () => {
    expect(hub).toMatch(/stewardly:hubBuiltinOrder:/);
  });
  it("Hub.tsx exposes a setBuiltinOrder setter inside the reorder handler", () => {
    expect(hub).toMatch(/setBuiltinOrder\(/);
  });
  it("Hub.tsx sorts data.builtins by saved order before rendering", () => {
    expect(hub).toMatch(/orderedBuiltins/);
  });
});
