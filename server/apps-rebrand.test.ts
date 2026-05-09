/**
 * Invariant tests for the "Engines → Apps" rebrand and the canonical engine routes.
 *
 * These tests do NOT exercise the React tree directly (we'd need jsdom + a heavier setup).
 * Instead they read the source files to enforce the invariants the user explicitly requested.
 *
 *   1. AppLayout's main sidebar drawer is titled "Apps" (not "Engines")
 *   2. The Apps drawer has a "Core" subheader wrapping <StewardshipNav />
 *   3. The Apps drawer has the three add-app menu items (Create / Browse public / Install from link)
 *   4. The Projects drawer "+" is a direct-create button (not a DropdownMenu submenu)
 *   5. App.tsx registers the canonical wealth engine routes that previously 404'd
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const APP_LAYOUT = readFileSync(
  resolve(__dirname, "../client/src/components/AppLayout.tsx"),
  "utf8",
);
const APP_TSX = readFileSync(
  resolve(__dirname, "../client/src/App.tsx"),
  "utf8",
);

describe("Apps rebrand: AppLayout sidebar drawer", () => {
  it('uses title="Apps" for the canonical 5-engine drawer (not "Engines")', () => {
    expect(APP_LAYOUT).toContain('title="Apps"');
    expect(APP_LAYOUT).toContain('testId="apps-drawer"');
  });

  it("has a Core subheader inside the Apps drawer", () => {
    // The Core label sits directly above <StewardshipNav />
    const coreSection = APP_LAYOUT.match(
      /Core[\s\S]{0,200}<StewardshipNav \/>/,
    );
    expect(coreSection, "expected 'Core' label directly above StewardshipNav").not.toBeNull();
  });

  it("has an Installed group inside the Apps drawer wired to InstalledAppsList", () => {
    // The drawer renders the InstalledAppsList component (which queries trpc.apps.listInstalled)
    // The component itself contains the empty-state text and the renders nav-links per installed app.
    expect(APP_LAYOUT).toMatch(/Installed[\s\S]{0,800}<InstalledAppsList/);
    expect(APP_LAYOUT).toContain('from "@/components/sidebar/InstalledAppsList"');
  });

  it("Apps + button opens add-menu with three options (Create / Browse public / Install from link)", () => {
    // The add-menu lives in the apps drawer's `actions` Popover
    expect(APP_LAYOUT).toContain("Create new app");
    expect(APP_LAYOUT).toContain("Browse public catalog");
    expect(APP_LAYOUT).toContain("Install from share link");
  });

  it("Projects + button is a direct-create button (no DropdownMenu submenu with 'New Task')", () => {
    // Find the Projects drawer's `actions=`
    const projectsBlockMatch = APP_LAYOUT.match(
      /title="Projects"[\s\S]*?\/SidebarDrawer>/,
    );
    expect(projectsBlockMatch, "expected to find Projects drawer block").not.toBeNull();
    const projectsBlock = projectsBlockMatch![0];
    // Within the Projects drawer block, the + button must NOT include a 'New Task' option
    // (that submenu is the bug we removed: the + should only create projects).
    expect(projectsBlock).not.toMatch(/New Task/);
    // And it should navigate directly to /projects (no dropdown)
    expect(projectsBlock).toMatch(/navigate\("\/projects"\)/);
    // And it should NOT contain a DropdownMenuTrigger
    expect(projectsBlock).not.toMatch(/DropdownMenuTrigger/);
  });
});

describe("Canonical engine routes registered (kills the 404 bug)", () => {
  it("registers /missional/wealth (top-level wealth hub)", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/missional\/wealth"/);
  });

  it("registers /financial-twin (canonical financial twin route)", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/financial-twin"/);
  });

  it("registers /tax-planning, /estate, /risk-assessment (canonical wealth leaves)", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/tax-planning"/);
    expect(APP_TSX).toMatch(/<Route\s+path="\/estate"/);
    expect(APP_TSX).toMatch(/<Route\s+path="\/risk-assessment"/);
  });

  it("registers /learning/* canonical learning routes", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/learning\/licenses"/);
    expect(APP_TSX).toMatch(/<Route\s+path="\/learning\/studio"/);
    expect(APP_TSX).toMatch(/<Route\s+path="\/learning\/review"/);
  });

  it("registers /financial-planning (canonical Missional planning surface)", () => {
    expect(APP_TSX).toMatch(/<Route\s+path="\/financial-planning"/);
  });
});
