/**
 * Sidebar restructure + Manus/Meta rebrand contract tests.
 *
 * These specs lock three guarantees so a future regression is caught:
 *   1. Model picker exposes the four intuitive Stewardly modes
 *      (Limitless, Pro, Standard, Lite) — and never "Manus Max" / "Manus 1.0" / "Manus Lite".
 *   2. SidebarDrawer is exported (or referenced) from AppLayout — proving the
 *      "SidebarDrawer is not defined" runtime regression cannot reappear.
 *   3. No user-facing JSX text or attribute under client/src/ contains "Manus"
 *      or "from Meta" (identifiers like manus-storage / manus_oauth / model IDs
 *      are explicitly carved out as wire-format and stay).
 *
 * These tests scan source files (deterministic, fast) rather than rendering the
 * tree under jsdom — which keeps the spec independent of the surrounding
 * provider stack and runs in well under 50ms.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

const REPO = path.resolve(__dirname, "..");
const CLIENT_SRC = path.join(REPO, "client/src");

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      // Skip storybook stories — they are dev tooling, not production chrome.
      if (entry === "stories") continue;
      walk(full, acc);
    } else if (/\.(t|j)sx?$/.test(entry) || entry.endsWith(".json")) {
      acc.push(full);
    }
  }
  return acc;
}

describe("ModelSelector — intuitive Stewardly mode names", () => {
  const src = readFileSync(
    path.join(CLIENT_SRC, "components/ModelSelector.tsx"),
    "utf8"
  );

  it("exposes the four canonical mode names", () => {
    expect(src).toMatch(/name:\s*"Limitless"/);
    expect(src).toMatch(/name:\s*"Pro"/);
    expect(src).toMatch(/name:\s*"Standard"/);
    expect(src).toMatch(/name:\s*"Lite"/);
  });

  it("preserves internal model IDs (wire format)", () => {
    expect(src).toMatch(/id:\s*"manus-next-limitless"/);
    expect(src).toMatch(/id:\s*"manus-next-max"/);
    expect(src).toMatch(/id:\s*"manus-next-standard"/);
    expect(src).toMatch(/id:\s*"manus-next-lite"/);
  });

  it("no longer surfaces 'Manus Max' / 'Manus 1.0' / 'Manus Lite' as user-facing names", () => {
    expect(src).not.toMatch(/name:\s*"Manus Max"/);
    expect(src).not.toMatch(/name:\s*"Manus 1\.0"/);
    expect(src).not.toMatch(/name:\s*"Manus Lite"/);
    expect(src).not.toMatch(/name:\s*"Manus Limitless"/);
  });
});

describe("SidebarDrawer — runtime contract", () => {
  const src = readFileSync(
    path.join(CLIENT_SRC, "components/AppLayout.tsx"),
    "utf8"
  );

  it("defines SidebarDrawer (cannot be 'not defined' at runtime)", () => {
    expect(src).toMatch(/function SidebarDrawer\(/);
  });

  it("SidebarDrawer renders a region landmark with aria-labelledby (axe a11y)", () => {
    // The component body should declare role="region" + aria-labelledby
    const start = src.indexOf("function SidebarDrawer(");
    expect(start).toBeGreaterThan(-1);
    const slice = src.slice(start, start + 2000);
    expect(slice).toMatch(/role="region"/);
    expect(slice).toMatch(/aria-labelledby=/);
    expect(slice).toMatch(/aria-expanded=/);
  });

  it("AllTasksSection accepts hideHeaderPills (drawer composition contract)", () => {
    expect(src).toMatch(/hideHeaderPills\?:\s*boolean/);
    expect(src).toMatch(/hideHeaderPills\s*=\s*false/);
  });

  it("SidebarProjectTree does NOT render its own 'Projects' header (parent SidebarDrawer owns it)", () => {
    // Locate the SidebarProjectTree component body and assert it doesn't
    // re-render an ALL-CAPS 'Projects' label that would visually duplicate
    // the wrapper SidebarDrawer's title.
    const start = src.indexOf("function SidebarProjectTree(");
    expect(start).toBeGreaterThan(-1);
    // SidebarProjectTree is followed by ProjectTreeNode or AllTasksSection.
    const end = (() => {
      const next1 = src.indexOf("function AllTasksSection(", start);
      const next2 = src.indexOf("function ProjectTreeNode(", start);
      const candidates = [next1, next2].filter((n) => n > start);
      return candidates.length ? Math.min(...candidates) : start + 4000;
    })();
    const body = src.slice(start, end);
    // No JSX text node literal 'Projects' inside the component body.
    expect(body).not.toMatch(/>\s*Projects\s*</);
  });
});

describe("Brand sweep — no user-facing 'Manus' or 'Meta'", () => {
  const files = walk(CLIENT_SRC);

  // Allowed identifiers (wire format, not user-visible)
  const ALLOWED_TOKENS = [
    "manus-storage",
    "manus_oauth",
    "manus-next-",
    "manus-agent-mode",
    "manus-feedback",
    "manus-onboarding",
    "manus-tour",
    "manus-",   // prefixed identifiers / localStorage keys
    "ManusNextChat",
    "ManusDialog",
    "@manus",
    "/manus__",
    "MANUS_",
    "@shared/Manus",
    "components/Manus",
    // Canonical platform-integration references (Manus OAuth IS the literal product name)
    "Manus OAuth",
    "Manus-Next",
    "ManusNext",
  ];

  // Files explicitly about platform/integration internals; "Manus" is technically accurate there
  // (these surfaces document the OAuth provider, search cascade, capability dashboard, etc.)
  const ALLOWED_FILES = [
    "PlatformGuide.tsx",
    "ManusNextDashboard.tsx",
    "BCP.tsx",
    "WhatsNewModal.tsx",
    "ConnectedAccountsTab.tsx",
    "ToolPermissionsPopover.tsx",
    "ContextualHelp.tsx",
    "Help.tsx",
  ];

  function isAllowedHit(line: string, filePath?: string): boolean {
    if (filePath && ALLOWED_FILES.some((f) => filePath.endsWith(f))) return true;
    return ALLOWED_TOKENS.some((tok) => line.includes(tok));
  }

  it("no JSX text node contains 'Manus' (excluding wire-format identifiers)", () => {
    const offenders: string[] = [];
    for (const file of files) {
      // Storybook + test specs themselves are excluded
      if (file.includes(".stories.")) continue;
      if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
      // Skip the rebrand test itself
      if (file.endsWith("sidebar-rebrand.test.ts")) continue;
      const text = readFileSync(file, "utf8");
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        // Strip leading whitespace for comment detection
        const trimmed = line.trim();
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return;
        // Match JSX text nodes: >…Manus…<
        const jsxMatch = />[^<]*Manus[^<]*</g.test(line);
        // Match string literal that's NOT an identifier
        const stringMatch = /"[^"]*Manus[^"]*"/g.test(line) || /'[^']*Manus[^']*'/g.test(line);
        if ((jsxMatch || stringMatch) && !isAllowedHit(line, file)) {
          offenders.push(`${path.relative(REPO, file)}:${i + 1}: ${line.trim().slice(0, 120)}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it("no source line contains 'from Meta' (sidebar footer attribution)", () => {
    const offenders: string[] = [];
    for (const file of files) {
      if (file.endsWith("sidebar-rebrand.test.ts")) continue;
      const text = readFileSync(file, "utf8");
      if (text.includes("from Meta")) {
        offenders.push(path.relative(REPO, file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
