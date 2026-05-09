/**
 * server/hub.test.ts — invariants for the Hub redesign.
 *
 * Pure structural / configuration checks (no DB needed). These guard the
 * 5-layer-aware Hub feature against accidental regressions:
 *
 *   • BUILTIN_ENGINE_APPS — exactly the 5 engines, with the rename
 *     "Continuous Improvement" → "Optimal" and stable builtin ids.
 *   • engineTaxonomy — engine #5 user-facing label is "Optimal".
 *   • Mobile bottom nav — replaces "Tasks" tab with "Hub" tab.
 *   • Sidebar layout — collapses Apps + Engines + Library into a single
 *     Hub drawer + a top-nav "Hub" link.
 *   • App routes — /hub renders the new Hub page; /library redirects to /hub.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BUILTIN_ENGINE_APPS } from "./routers/hub";
import { ENGINES } from "../shared/engineTaxonomy";

const ROOT = resolve(__dirname, "..");
function read(p: string): string {
  return readFileSync(resolve(ROOT, p), "utf8");
}

describe("Hub: BUILTIN_ENGINE_APPS", () => {
  it("contains exactly the 5 canonical engines", () => {
    expect(BUILTIN_ENGINE_APPS).toHaveLength(5);
    const ids = BUILTIN_ENGINE_APPS.map((e) => e.builtinId).sort();
    expect(ids).toEqual([
      "engine:contextual",
      "engine:formational",
      "engine:missional",
      "engine:optimal",
      "engine:relational",
    ]);
  });

  it("renames Continuous Improvement to Optimal in the customer-facing label", () => {
    const optimal = BUILTIN_ENGINE_APPS.find((e) => e.builtinId === "engine:optimal");
    expect(optimal).toBeDefined();
    expect(optimal!.label).toBe("Optimal");
  });

  it("preserves the legacy /continuous-improvement route so deep links keep working", () => {
    const optimal = BUILTIN_ENGINE_APPS.find((e) => e.builtinId === "engine:optimal");
    expect(optimal!.path).toBe("/continuous-improvement");
  });

  it("every engine app has a distinct sortOrder so the grid is deterministic", () => {
    const orders = BUILTIN_ENGINE_APPS.map((e) => e.sortOrder);
    expect(new Set(orders).size).toBe(orders.length);
  });
});

describe("engineTaxonomy: 5-layer engine list", () => {
  it("relabels the 5th engine to Optimal while keeping the route id stable", () => {
    const e5 = ENGINES.find((e) => e.id === "continuous-improvement");
    expect(e5).toBeDefined();
    expect(e5!.label).toBe("Optimal");
    expect(e5!.path).toBe("/continuous-improvement");
  });

  it("still exposes all 5 layers in canonical order", () => {
    const ids = ENGINES.map((e) => e.id);
    expect(ids).toEqual([
      "formational",
      "relational",
      "missional",
      "contextual",
      "continuous-improvement",
    ]);
  });
});

describe("Mobile bottom nav: Hub replaces Tasks", () => {
  const src = read("client/src/components/MobileBottomNav.tsx");

  it("declares a Hub primary nav item pointing at /hub", () => {
    expect(src).toMatch(/path:\s*"\/hub",\s*label:\s*"Hub"/);
  });

  it("does not keep Tasks as a primary tab", () => {
    // Tasks must not appear as a primary item; check the PRIMARY_ITEMS array
    // does not contain { label: "Tasks", ... }.
    const primaryBlock = src.match(/PRIMARY_ITEMS[\s\S]*?\];/);
    expect(primaryBlock).toBeTruthy();
    expect(primaryBlock![0]).not.toMatch(/label:\s*"Tasks"/);
  });

  it("keeps Tasks reachable via the More menu so functionality isn't lost", () => {
    const moreBlock = src.match(/MORE_ITEMS[\s\S]*?\];/);
    expect(moreBlock).toBeTruthy();
    expect(moreBlock![0]).toMatch(/label:\s*"Tasks"/);
  });
});

describe("Sidebar: Hub consolidates Apps + Engines + Library", () => {
  const src = read("client/src/components/AppLayout.tsx");

  it("primary nav links to /hub (not /library)", () => {
    expect(src).toMatch(/data-testid="sidebar-hub-link"/);
    expect(src).toMatch(/href="\/hub"/);
    expect(src).not.toMatch(/href="\/library"[\s\S]{0,200}?Library<\/Link>/);
  });

  it("sidebar deliberately has NO Hub drawer / Engines list / Open-Hub-grid link (those live inside /hub)", () => {
    // The single nav row is the only Hub surface in the sidebar.
    expect(src).not.toMatch(/testId="hub-drawer"/);
    expect(src).not.toMatch(/testId="apps-drawer"/);
    expect(src).not.toMatch(/Open Hub grid/);
    // The 5 engines must NOT be enumerated in the sidebar; they live in /hub.
    // StewardshipNav was the engine enumerator; assert it isn't mounted here.
    expect(src).not.toMatch(/<StewardshipNav\s*\/>/);
  });

  it("sidebar still renders the Projects + All Tasks drawers (auth-only)", () => {
    expect(src).toMatch(/testId="projects-drawer"/);
    expect(src).toMatch(/testId="all-tasks-drawer"|title="All Tasks"/);
  });

  it("command palette routes the Hub item to /hub", () => {
    expect(src).toMatch(/value="Hub"[\s\S]{0,200}?navigate\("\/hub"\)/);
  });
});

describe("App routes: /hub registered, /library redirects", () => {
  const app = read("client/src/App.tsx");

  it("lazy-imports the Hub page", () => {
    expect(app).toMatch(/const Hub = lazy\(\(\) => import\("\.\/pages\/Hub"\)\)/);
  });

  it("registers /hub and /hub/:folderId routes", () => {
    expect(app).toMatch(/path="\/hub"[\s\S]{0,200}?<Hub \/>/);
    expect(app).toMatch(/path="\/hub\/:folderId"/);
  });

  it("redirects legacy /library to /hub", () => {
    expect(app).toMatch(/path="\/library">[\s\S]{0,150}?<Redirect to="\/hub"/);
  });
});


/* ───────────────────────────────────────────────────────────────────────── */
/* Round 2 invariants — based on user-reported screenshot bugs              */
/* ───────────────────────────────────────────────────────────────────────── */

describe("Hub: tile contrast in BOTH themes (no pastel-on-light)", () => {
  it("Hub.tsx tile container uses bg-card (theme-neutral, opaque), not the prior /15 translucent tints", () => {
    const src = read("client/src/pages/Hub.tsx");
    expect(src).toContain("bg-card text-card-foreground border border-border");
    // The previous pastel-translucent containers must be gone:
    expect(src).not.toMatch(/bg-emerald-500\/15 border-emerald-500\/40/);
    expect(src).not.toMatch(/bg-rose-500\/15 border-rose-500\/40/);
    expect(src).not.toMatch(/bg-blue-500\/15 border-blue-500\/40/);
  });
  it("Hub.tsx tile labels resolve to text-card-foreground so they are legible in light AND dark", () => {
    const src = read("client/src/pages/Hub.tsx");
    expect(src).toContain("text-card-foreground");
  });
});

describe("Hub: drag-to-reorder + folder-on-drop is wired with @dnd-kit", () => {
  it("Hub.tsx imports the @dnd-kit primitives", () => {
    const src = read("client/src/pages/Hub.tsx");
    expect(src).toContain('from "@dnd-kit/core"');
    expect(src).toContain('from "@dnd-kit/sortable"');
    expect(src).toContain("PointerSensor");
    expect(src).toContain("TouchSensor"); // iOS Safari support
    expect(src).toContain("SortableContext");
  });
  it("Hub.tsx defines a sortable grid component and wires hub.move + hub.createFolder mutations", () => {
    const src = read("client/src/pages/Hub.tsx");
    expect(src).toContain("function SortableHubGrid");
    expect(src).toContain("trpc.hub.move.useMutation");
    expect(src).toContain("trpc.hub.createFolder.useMutation");
  });
  it("@dnd-kit packages are declared in package.json", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.["@dnd-kit/core"]).toBeTruthy();
    expect(pkg.dependencies?.["@dnd-kit/sortable"]).toBeTruthy();
    expect(pkg.dependencies?.["@dnd-kit/utilities"]).toBeTruthy();
  });
});

describe("EngineHubPage: surfaces every real feature, not 2-3 stubs", () => {
  it("uses disclosure level 4 so every taxonomy leaf the user can see renders", () => {
    const src = read("client/src/pages/EngineHubPage.tsx");
    // Numeric literal 4 passed to visibleEnginesFor:
    expect(src).toMatch(/visibleEnginesFor\s*\(\s*role\s*,\s*4\s*\)/);
  });
  it("renders LeafTile entries on opaque bg-card chrome, not glass-card pastel", () => {
    const src = read("client/src/pages/EngineHubPage.tsx");
    expect(src).toContain("bg-card text-card-foreground border border-border");
  });
  it("page wrapper is mobile-scrollable (uses normal container + pb-32, no min-h-screen flex trap)", () => {
    const src = read("client/src/pages/EngineHubPage.tsx");
    expect(src).toMatch(/container py-8 pb-32/);
    expect(src).not.toMatch(/min-h-screen/);
  });
});

describe("Engine taxonomy: real route inventory the Hub now surfaces", () => {
  it("Formational has at least 5 leaves", () => {
    const f = ENGINES.find((e) => e.id === "formational");
    expect((f?.leaves ?? []).length).toBeGreaterThanOrEqual(5);
  });
  it("Relational has at least 6 leaves", () => {
    const r = ENGINES.find((e) => e.id === "relational");
    expect((r?.leaves ?? []).length).toBeGreaterThanOrEqual(6);
  });
  it("Missional has at least 1 mission with 9 leaves (Wealth)", () => {
    const m = ENGINES.find((e) => e.id === "missional");
    const wealth = m?.missions?.find((x) => x.slug === "wealth");
    expect((wealth?.leaves ?? []).length).toBeGreaterThanOrEqual(9);
  });
  it("Contextual has at least 6 leaves", () => {
    const c = ENGINES.find((e) => e.id === "contextual");
    expect((c?.leaves ?? []).length).toBeGreaterThanOrEqual(6);
  });
  it("Optimal (continuous-improvement) has at least 6 leaves", () => {
    const o = ENGINES.find((e) => e.id === "continuous-improvement");
    expect((o?.leaves ?? []).length).toBeGreaterThanOrEqual(6);
  });
});


/* ───────────────────────────────────────────────────────────────────────── */
/* Round 3 — hub.listPublic so engines render even before sign-in           */
/* ───────────────────────────────────────────────────────────────────────── */
describe("hub.listPublic — engines visible to unauthed visitors", () => {
  const hubRouterSrc = read("server/routers/hub.ts");
  const hubPageSrc = read("client/src/pages/Hub.tsx");

  it("hub.listPublic exists and is publicProcedure", () => {
    expect(hubRouterSrc).toMatch(/listPublic:\s*publicProcedure/);
  });

  it("listPublic returns BUILTIN_ENGINE_APPS so engines always render", () => {
    expect(hubRouterSrc).toMatch(/listPublic[\s\S]{0,500}builtins:\s*BUILTIN_ENGINE_APPS/);
  });

  it("Hub.tsx falls back to listPublic when there is no authed user", () => {
    expect(hubPageSrc).toMatch(/trpc\.hub\.listPublic\.useQuery/);
    expect(hubPageSrc).toMatch(/enabled:\s*!authUser/);
  });
});


/* ───────────────────────────────────────────────────────────────────────── */
/* Round 4 — engine pages must show full leaf inventory for unauthed users  */
/* ───────────────────────────────────────────────────────────────────────── */
describe("EngineHubPage: unauthed visitors see the full leaf inventory", () => {
  const src = read("client/src/pages/EngineHubPage.tsx");
  const tax = read("shared/engineTaxonomy.ts");

  it("engine taxonomy exports previewEnginesFor() that ignores role gating", () => {
    expect(tax).toMatch(/export function previewEnginesFor/);
  });

  it("EngineHubPage imports previewEnginesFor and uses it when there are no roles", () => {
    expect(src).toContain("previewEnginesFor");
    expect(src).toMatch(/isUnauthed[\s\S]{0,200}previewEnginesFor\(4\)/);
  });

  it("previewEnginesFor returns every engine and every leaf at disclosure 4", async () => {
    const mod = await import("../shared/engineTaxonomy");
    const engines = mod.previewEnginesFor(4);
    expect(engines).toHaveLength(5);
    const byId = Object.fromEntries(engines.map((e) => [e.id, e]));
    expect(byId.formational.leaves!.length).toBeGreaterThanOrEqual(5);
    expect(byId.relational.leaves!.length).toBeGreaterThanOrEqual(6);
    expect(byId.contextual.leaves!.length).toBeGreaterThanOrEqual(6);
    expect(byId["continuous-improvement"].leaves!.length).toBeGreaterThanOrEqual(6);
    const wealth = byId.missional.missions!.find((m) => m.slug === "wealth");
    expect(wealth!.leaves.length).toBeGreaterThanOrEqual(9);
  });
});
