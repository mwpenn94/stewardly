/**
 * Round 7 — engine page polish invariants
 *
 * Locks down the structural fixes so they can't silently regress:
 *   1. EngineHubPage wraps its workspace in a real `overflow-y-auto`
 *      scroll container (the cause of the original "engine pages don't
 *      scroll" bug).
 *   2. The leaf grid is sortable via @dnd-kit (drag-to-reorder ships).
 *   3. Glass tile system is present (GlassCard primitive + SortableLeafGrid
 *      compose it, so the iOS-26 frosted look survives refactors).
 *   4. Server side has both `engines.getLayout` and `engines.setLayout`
 *      procedures and the `engine_widget_layouts` table is declared.
 *   5. Old static, hover-only Card-based LeafTile is gone — guarantees
 *      we actually shipped the new component.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("Round 7 — engine polish invariants", () => {
  describe("EngineHubPage", () => {
    const src = read("client/src/pages/EngineHubPage.tsx");

    it("wraps workspace in a real scroll container (overflow-y-auto)", () => {
      expect(src).toMatch(/data-engine-scroll-container="true"/);
      expect(src).toMatch(/overflow-y-auto/);
    });

    it("uses GlassCard for the engine hero", () => {
      expect(src).toMatch(/import GlassCard from "@\/components\/glass\/GlassCard"/);
      expect(src).toMatch(/<GlassCard/);
    });

    it("delegates leaf rendering to SortableLeafGrid (no static LeafTile)", () => {
      expect(src).toMatch(/import SortableLeafGrid from "@\/components\/glass\/SortableLeafGrid"/);
      expect(src).toMatch(/<SortableLeafGrid/);
      // The old in-file LeafTile component must be gone.
      expect(src).not.toMatch(/function LeafTile\(/);
    });

    it("passes engineId to the sortable grid for per-engine persistence", () => {
      expect(src).toMatch(/engineId=\{String\(engineId\)\}/);
    });

    it("emits a separate sortable surface per mission specialization", () => {
      expect(src).toMatch(/engineId=\{`\$\{String\(engineId\)\}\.\$\{mission\.slug\}`\}/);
    });

    it("disables persistence for unauthenticated visitors (persist={!isUnauthed})", () => {
      expect(src).toMatch(/persist=\{!isUnauthed\}/);
    });
  });

  describe("GlassCard primitive", () => {
    const src = read("client/src/components/glass/GlassCard.tsx");

    it("ships three intensity tiers", () => {
      expect(src).toMatch(/subtle/);
      expect(src).toMatch(/regular/);
      expect(src).toMatch(/vivid/);
    });

    it("uses backdrop-blur for the frosted glass base", () => {
      expect(src).toMatch(/backdrop-blur/);
    });

    it("applies an inset highlight and outer shadow for depth", () => {
      expect(src).toMatch(/shadow-\[/);
      expect(src).toMatch(/inset/);
    });

    it("exposes an `interactive` prop for hover-lift behavior", () => {
      expect(src).toMatch(/interactive\?:\s*boolean/);
      expect(src).toMatch(/hover:-translate-y/);
    });
  });

  describe("SortableLeafGrid", () => {
    const src = read("client/src/components/glass/SortableLeafGrid.tsx");

    it("uses @dnd-kit/core + @dnd-kit/sortable", () => {
      expect(src).toMatch(/from "@dnd-kit\/core"/);
      expect(src).toMatch(/from "@dnd-kit\/sortable"/);
    });

    it("activates drag at 8px to preserve link click-through", () => {
      expect(src).toMatch(/distance:\s*8/);
    });

    it("calls trpc.engines.setLayout on drag end (when authed)", () => {
      expect(src).toMatch(/trpc\.engines\.setLayout\.useMutation/);
      expect(src).toMatch(/setLayout\.mutate/);
    });

    it("hydrates initial order from trpc.engines.getLayout", () => {
      expect(src).toMatch(/trpc\.engines\.getLayout\.useQuery/);
    });

    it("uses GlassCard for each leaf tile", () => {
      expect(src).toMatch(/import GlassCard from "\.\/GlassCard"/);
      expect(src).toMatch(/<GlassCard/);
    });

    it("intersects saved order with current taxonomy (drops removed leaves)", () => {
      expect(src).toMatch(/validSaved/);
      expect(src).toMatch(/missing/);
    });

    it("exposes a drag handle button with aria-label", () => {
      expect(src).toMatch(/aria-label="Drag to reorder"/);
    });
  });

  describe("Server: engine_widget_layouts table + endpoints", () => {
    const schema = read("drizzle/schema.ts");
    const router = read("server/routers/engines.ts");

    it("declares engineWidgetLayouts table with userId + engineId + order", () => {
      expect(schema).toMatch(/engineWidgetLayouts\s*=\s*mysqlTable\(/);
      expect(schema).toMatch(/"engine_widget_layouts"/);
      expect(schema).toMatch(/engine_id/);
      expect(schema).toMatch(/order/);
    });

    it("enforces a unique (userId, engineId) constraint", () => {
      expect(schema).toMatch(/uniqueIndex\("engine_widget_layouts_user_engine_uniq"\)/);
    });

    it("exposes engines.getLayout as a protected procedure", () => {
      expect(router).toMatch(/getLayout:\s*protectedProcedure/);
    });

    it("exposes engines.setLayout as a protected procedure with upsert semantics", () => {
      expect(router).toMatch(/setLayout:\s*protectedProcedure/);
      // Upsert: we look up existing row, then update OR insert.
      expect(router).toMatch(/\.update\(engineWidgetLayouts\)/);
      expect(router).toMatch(/\.insert\(engineWidgetLayouts\)/);
    });

    it("setLayout caps order length at 64 and engineId length at 64", () => {
      expect(router).toMatch(/engineId:\s*z\.string\(\)\.min\(1\)\.max\(64\)/);
      expect(router).toMatch(/order:\s*z\.array.*\.max\(64\)/s);
    });
  });
});


describe("Round 7 — no dead engine-leaf links", () => {
  it("every leaf.path in the engine taxonomy has a matching <Route> in App.tsx", () => {
    const taxonomy = read("shared/engineTaxonomy.ts");
    const app = read("client/src/App.tsx");

    const leafMatches = Array.from(taxonomy.matchAll(/path:\s*"(\/[^"]+)"/g));
    const leafPaths = Array.from(new Set(leafMatches.map((m) => m[1])));
    expect(leafPaths.length).toBeGreaterThan(20); // sanity floor

    const routeMatches = Array.from(app.matchAll(/<Route\s+path="(\/[^"]+)"/g));
    const routePaths = new Set(routeMatches.map((m) => m[1]));

    const orphans = leafPaths.filter((p) => !routePaths.has(p));
    expect(orphans, `Engine taxonomy has leaves with no matching <Route>: ${orphans.join(", ")}`).toEqual([]);
  });
});


describe("Round 7 — adversarial invariants", () => {
  describe("SortableLeafGrid hardening", () => {
    const src = read("client/src/components/glass/SortableLeafGrid.tsx");

    it("does not call useAuth() — uses tolerant useContext(AuthContext) instead", () => {
      // Throwing useAuth() inside a leaf component cascades when the page
      // is mounted outside the AuthProvider (preview shells, marketing
      // pages). Round 7 pass 2 hardened this; lock it down.
      // Match `useAuth(` only as a call-site (preceded by whitespace,
      // start-of-line, `=`, `(`, `,`, or `{`); the doc comment that
      // mentions "useAuth() would" must not be considered a regression.
      // The doc-comment line `// throwing the way useAuth() would.` has
      // a leading `// ` then `useAuth(`; we accept that comment context
      // by requiring useAuth(...) to be preceded by `=` or `(` or `,` or
      // `{` (call-site after destructuring/assignment), not by whitespace.
      expect(src).not.toMatch(/[=({,]\s*useAuth\s*\(/);
      expect(src).toMatch(/useContext\(AuthContext\)/);
    });

    it("only enables the layout query when the user is authed (avoids 401 spam)", () => {
      expect(src).toMatch(/enabled:\s*isAuthed/);
    });

    it("stops propagation on the drag handle so the parent Link doesn't fire", () => {
      expect(src).toMatch(/e\.stopPropagation\(\)/);
    });

    it("keeps drag disabled when persistence is off (unauthed visitors can't reorder)", () => {
      expect(src).toMatch(/disabled:\s*!draggable/);
    });
  });

  describe("AuthContext export", () => {
    const src = read("client/src/contexts/AuthContext.tsx");

    it("exports the AuthContext directly so consumers can read it tolerantly", () => {
      expect(src).toMatch(/export const AuthContext\s*=\s*createContext/);
    });
  });

  describe("Hub scrollability", () => {
    const src = read("client/src/pages/Hub.tsx");

    it("Hub root has its own overflow-y-auto scroll container", () => {
      expect(src).toMatch(/data-hub-scroll-container="true"/);
      expect(src).toMatch(/overflow-y-auto/);
    });
  });
});
