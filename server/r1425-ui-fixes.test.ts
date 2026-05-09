/**
 * R14.25 — UI fixes regression guards (source-file inspection).
 *
 * Each test pins a specific symptom the user reported in the 9 mobile
 * screenshots so a future refactor can't silently undo the fix.
 *
 *   c) FAB collision: GlobalVoiceFAB and MobileBottomNav `+` button must
 *      sit ABOVE the bottom nav (i.e. include a vertical offset class
 *      that clears the 3.5rem nav bar) AND AppLayout's <main> must give
 *      enough bottom padding so cards aren't covered.
 *   e) Improvement Engine top tab strip must use horizontal scroll with
 *      shrink-0 buttons so labels never compress to "Compli…".
 *   f) Comparables main has explicit pb-32 mobile bottom padding.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "..", "client", "src");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf-8");

describe("R14.25.c — FAB anchor + content padding", () => {
  it("GlobalVoiceFAB sits above the bottom nav (mobile)", () => {
    const src = read("components/GlobalVoiceFAB.tsx");
    // Expect a bottom offset >= md:bottom-6 and either a calc() or a
    // tailwind value that clears the 3.5rem mobile nav bar.
    expect(src).toMatch(/bottom-(?:20|24|\[)/);
  });

  it("MobileBottomNav `+` FAB sits above the bottom nav", () => {
    const src = read("components/MobileBottomNav.tsx");
    // Inline style anchors the `+` FAB above the 3.5rem bottom nav,
    // factoring in the iOS safe-area inset.
    expect(src).toMatch(/bottom:\s*["`]calc\(4\.5rem \+ env\(safe-area-inset-bottom/);
  });

  it("AppLayout main reserves bottom space for the FABs on mobile", () => {
    const src = read("components/AppLayout.tsx");
    // Either pb-36 / pb-32 / pb-[9rem] / safe-area inset env, etc.
     expect(src).toMatch(/pb-(?:28|32|36|\[)/);
  });
});

describe("R14.25.e — ContinuousImprovement applet tab strip", () => {
  const src = read("pages/ContinuousImprovementApplet.tsx");

  it("uses horizontal scroll on the mobile tab row", () => {
    expect(src).toContain("overflow-x-auto");
  });

  it("buttons are shrink-0 so labels never compress to '…'", () => {
    // Mobile tab buttons must include the shrink-0 utility.
    expect(src).toMatch(/shrink-0[^\n]*whitespace-nowrap|whitespace-nowrap[^\n]*shrink-0/);
  });
});

describe("R14.25.f — Comparables card has bottom safety padding", () => {
  const src = read("pages/Comparables.tsx");
  it("main has pb-32 on mobile so the last card clears the FAB", () => {
    expect(src).toContain("pb-32");
  });
});

describe("R14.28 — sidebar bottom Hub icon removed (redundant with top sidebar Hub link)", () => {
  it("AppLayout.tsx no longer references AppsGridMenu — the bottom-bar Hub (LayoutGrid) icon is fully removed", () => {
    const src = readFileSync(
      resolve(root, "components/AppLayout.tsx"),
      "utf-8",
    );
    expect(src).not.toContain("AppsGridMenu");
    // The associated taxonomy import must also be gone so tsc stays clean.
    expect(src).not.toContain("visibleEnginesFor");
  });
});

describe("R14.26 — TabsList primitive forces horizontal scroll on mobile", () => {
  it("ui/tabs.tsx applies max-sm:!flex / !overflow-x-auto / !w-max / !flex-nowrap so consumer `grid grid-cols-N` overrides do not overlap labels on narrow viewports", () => {
    const src = readFileSync(
      resolve(root, "components/ui/tabs.tsx"),
      "utf-8",
    );
    expect(src).toContain("max-sm:!flex");
    expect(src).toContain("max-sm:!w-max");
    expect(src).toContain("max-sm:!overflow-x-auto");
    expect(src).toContain("max-sm:!flex-nowrap");
    // R14.27: child-selector additions to keep TabsTrigger widths from
    // collapsing to 0 on top of each other (IMG_7807) when the consumer
    // grid is overridden.
    expect(src).toContain("max-sm:[&>*]:!w-auto");
    expect(src).toContain("max-sm:[&>*]:!min-w-fit");
    expect(src).toContain("max-sm:[&>*]:!shrink-0");
  });
});


describe("R14.30 — Hub mobile FAB de-duplication", () => {
  it("MobileBottomNav `+` FAB is hidden on /hub so Hub's own '+' is the sole trigger", () => {
    const src = read("components/MobileBottomNav.tsx");
    // The conditional that gates the global FAB must explicitly exclude /hub
    // (and /hub/*) on top of the existing / and /task/* exclusions.
    expect(src).toMatch(/location\s*!==\s*"\/hub"/);
    expect(src).toMatch(/!location\.startsWith\("\/hub\/"\)/);
  });

  it("Hub page still owns its contextual 'Add to Hub' '+' button", () => {
    const src = read("pages/Hub.tsx");
    // Hub's local FAB must remain present with its dedicated aria-label.
    expect(src).toMatch(/aria-label="Add to Hub"/);
  });
});


describe("R14.31 — Hub `+` FAB alignment", () => {
  it("Hub `Add to Hub` FAB uses the same calc(4.5rem + safe-area) bottom as the global `+` FAB", () => {
    const src = read("pages/Hub.tsx");
    expect(src).toMatch(/aria-label="Add to Hub"/);
    // Same inline style anchor as MobileBottomNav so y-position matches Billing/Home.
    expect(src).toMatch(/bottom:\s*["`]calc\(4\.5rem \+ env\(safe-area-inset-bottom/);
  });

  it("Hub `Add to Hub` FAB uses z-50 to layer above the bottom nav like the global FAB", () => {
    const src = read("pages/Hub.tsx");
    // Block of classes for the Hub `Add to Hub` button must include z-50.
    expect(src).toMatch(/aria-label="Add to Hub"[\s\S]{0,200}/);
    // Inspect the className line directly above the aria-label.
    const lines = src.split("\n");
    const idx = lines.findIndex((l) => l.includes('aria-label="Add to Hub"'));
    const cls = lines.slice(Math.max(0, idx - 5), idx).join(" ");
    expect(cls).toMatch(/z-50/);
  });
});


describe("R14.32 — Hub mobile 'Load failed' loop suppression", () => {
  it("main.tsx suppresses 'Load failed' from the user-facing toast (Safari iOS transient network errors are auto-retried by React Query)", () => {
    const src = readFileSync(
      resolve(root, "main.tsx"),
      "utf-8",
    );
    expect(src).toContain("'Load failed'");
    expect(src).toContain("'Failed to fetch'");
    expect(src).toContain("'NetworkError when attempting to fetch'");
    // ECONN/ETIMEDOUT/network-error patterns must also be in the suppression list
    // so they don't surface as user-facing toasts during retry.
    expect(src).toContain("'ERR_NETWORK'");
    expect(src).toContain("'fetch failed'");
  });

  it("queryClient retries network failures up to 3 times so the user only sees a toast on persistent failure", () => {
    const src = readFileSync(
      resolve(root, "main.tsx"),
      "utf-8",
    );
    // Confirm the retry policy exists so suppressing the toast doesn't mean
    // the request is silently dropped.
    expect(src).toMatch(/error\.message === 'Failed to fetch'[\s\S]*?failureCount < 3/);
  });
});


describe("R14.33 — Hub renders builtins even when authed query fails", () => {
  const src = readFileSync(resolve(root, "pages/Hub.tsx"), "utf-8");

  it("publicQuery is NOT gated by `enabled: !authUser` so builtins are always available as fallback", () => {
    // Confirm publicQuery doesn't have the old `enabled: !authUser` gate.
    expect(src).not.toMatch(/listPublic\.useQuery\(undefined,\s*\{\s*enabled:\s*!\s*authUser/);
    // Confirm publicQuery is configured with staleTime instead.
    expect(src).toMatch(/listPublic\.useQuery\(undefined,\s*\{[\s\S]{0,80}staleTime/);
  });

  it("data resolution cascades from authedQuery → publicQuery → safe defaults", () => {
    // The new useMemo merges authed and public data so builtins always render.
    expect(src).toMatch(/const data = useMemo\(\(\)/);
    expect(src).toMatch(/publicQuery\.data \?\? \{ items: \[\] as any\[\], builtins: \[\] as any\[\] \}/);
    expect(src).toMatch(/authUser && authedQuery\.data/);
  });

  it("isLoading only true when BOTH queries are still in flight", () => {
    expect(src).toMatch(/isLoading = publicQuery\.isLoading && \(authUser \? authedQuery\.isLoading : true\)/);
  });

  it("authedQuery uses retry: 1 to limit retry storm on persistent failure", () => {
    expect(src).toMatch(/enabled:\s*!!authUser,\s*retry:\s*1/);
  });
});


describe("R14.34a — Home input bar removes confusing Sparkles toggle, keeps voice mic + send only", () => {
  const src = readFileSync(resolve(root, "pages/Home.tsx"), "utf-8");

  it("input bar's right-side action group no longer contains the Sparkles recursive-optimization toggle", () => {
    // The right-side action group must not contain the Sparkles button.
    // Find the "/* Right side: mic + send" comment and inspect the next ~30 lines.
    const idx = src.indexOf("Right side: mic + send");
    expect(idx).toBeGreaterThan(-1);
    const slice = src.slice(idx, idx + 1200);
    // Sparkles must not appear inside the input action group (it can still be
    // used elsewhere in the file, e.g. quick action chip icons).
    expect(slice).not.toMatch(/<Sparkles\s+className/);
    // Voice mic and send button must still be present.
    expect(slice).toMatch(/<VoiceMicButton/);
    expect(slice).toMatch(/onClick=\{handleSubmit\}/);
  });

  it("recursive optimization functionality is preserved (taskRecursiveOpt still passed to createTask)", () => {
    expect(src).toMatch(/createTask\([^)]*taskRecursiveOpt/);
  });
});

describe("R14.34b — Manage button is pinned, never buried by templates row", () => {
  const src = readFileSync(resolve(root, "components/TaskTemplates.tsx"), "utf-8");

  it("compact view starts with a pinned Manage button outside the scroll container", () => {
    const idx = src.indexOf("if (compact)");
    expect(idx).toBeGreaterThan(-1);
    const slice = src.slice(idx, idx + 2000);
    // Manage button comes BEFORE the scrollable templates list and is shrink-0.
    const manageIdx = slice.indexOf('aria-label="Manage templates"');
    const scrollContainerIdx = slice.indexOf("overflow-x-auto");
    expect(manageIdx).toBeGreaterThan(-1);
    expect(scrollContainerIdx).toBeGreaterThan(-1);
    expect(manageIdx).toBeLessThan(scrollContainerIdx);
    // Manage button must be shrink-0 so it never collapses. Inspect the
    // surrounding ~400 chars (which include the className).
    const manageBlock = slice.slice(Math.max(0, manageIdx - 400), manageIdx + 400);
    expect(manageBlock).toContain("shrink-0");
  });

  it("Manage button no longer lives inside the scrolling templates row (no second Manage block after templates.map)", () => {
    // Count occurrences of the literal Manage button rendering — should be 1
    // (the pinned one) instead of 2 (old: pinned + inside scroll row).
    const manageButtons = src.match(/setManageOpen\(true\)/g) || [];
    // The compact view + the management dialog open call inside other places
    // (edit, etc.) should still appear; but specifically the BUTTON inside the
    // scroll row is removed. Verify by checking for the 'Manage button' comment
    // that previously sat after templates.map was removed.
    expect(src).not.toMatch(/\{\/\* Manage button \*\/\}\s*\n\s*\{templates\.length > 0/);
    expect(manageButtons.length).toBeGreaterThanOrEqual(1);
  });
});

describe("R14.34c — templates router has zero auto-seed/auto-create logic", () => {
  const src = readFileSync(resolve(__dirname, "routers", "templates.ts"), "utf-8");

  it("templates.list is a pure read query with no side effects (no createTaskTemplate / insert calls)", () => {
    // Find the .list procedure body (small router, ~58 lines).
    const listIdx = src.indexOf("list:");
    expect(listIdx).toBeGreaterThan(-1);
    const listSlice = src.slice(listIdx, listIdx + 400);
    expect(listSlice).not.toMatch(/createTaskTemplate|insert\b/);
  });

  it("templates router does not import any default-template seed array", () => {
    expect(src).not.toMatch(/DEFAULT_TEMPLATES|BUILTIN_TEMPLATES|seedTemplates|defaultTemplate/);
  });
});


describe("R14.21 — single-h1-per-page accessibility audit", () => {
  it("TemplateLibrary.tsx has exactly one h1 (the list-view header)", () => {
    const src = readFileSync(resolve(root, "components/TemplateLibrary.tsx"), "utf-8");
    const h1Count = (src.match(/<h1\b/g) || []).length;
    expect(h1Count).toBe(1);
  });

  it("GuestExplorationMode.tsx has exactly one h1 (the hero title)", () => {
    const src = readFileSync(resolve(root, "components/GuestExplorationMode.tsx"), "utf-8");
    const h1Count = (src.match(/<h1\b/g) || []).length;
    expect(h1Count).toBe(1);
  });

  it("CodeViewerPanel and CodeDiffViewer h1s are inside string literals (no real DOM h1 collisions)", () => {
    // These two files contain h1 tokens only inside JS string literals used as
    // sample editor content. Verify they aren't actual JSX <h1 className=…
    // tags in the rendered output.
    for (const file of ["components/CodeViewerPanel.tsx", "components/CodeDiffViewer.tsx"]) {
      const src = readFileSync(resolve(root, file), "utf-8");
      const jsxH1Count = (src.match(/<h1\s+className=/g) || []).length;
      expect(jsxH1Count, `${file} should have no JSX h1 with className`).toBe(0);
    }
  });
});


describe("R14.24 — voice agent action handler safety net", () => {
  const src = readFileSync(resolve(root, "contexts/AgentBridgeContext.tsx"), "utf-8");

  it("each non-navigational action surfaces both a toast AND speaks via TTS", () => {
    // Inspect the executeAction switch — for the four non-nav actions
    // (summarize/answer/clarify/speak), each branch must include both a toast
    // call and a `speak(` call so users always get a visible artifact even
    // when mobile Safari blocks speechSynthesis.
    const actionsRequiringBoth: Array<[string, RegExp]> = [
      ["answer/speak combined branch", /case "speak":\s*\n\s*case "answer":[\s\S]*?toast\.[a-z]+\([\s\S]*?await speak\(/],
      ["summarize", /case "summarize":[\s\S]*?toast\.message\([\s\S]*?await speak\(/],
      ["clarify", /case "clarify":[\s\S]*?toast\.message\([\s\S]*?await speak\(/],
    ];
    for (const [name, re] of actionsRequiringBoth) {
      expect(src, `${name} must call toast + speak`).toMatch(re);
    }
  });

  it("unknown action types surface a diagnostic toast (not silent failure)", () => {
    expect(src).toMatch(/no handler for action[\s\S]*?toast\.error\(`Agent returned an unknown action type/);
  });

  it("LLM/network errors in runUtterance surface a friendly toast + speech", () => {
    expect(src).toMatch(/friendlyError\(err\)[\s\S]*?toast\.error\(friendly\)[\s\S]*?await speak\(friendly\)/);
  });

  it("voice state machine exposes the four required states (idle/thinking/speaking + listening tracked separately)", () => {
    expect(src).toMatch(/voiceState:\s*"idle"\s*\|\s*"thinking"\s*\|\s*"speaking"/);
  });
});


describe("R14.25.e/f — mobile overflow + content padding for FAB clearance", () => {
  it("ImprovementEngine direction tab row scrolls horizontally on narrow screens", () => {
    const src = readFileSync(resolve(root, "pages/ImprovementEngine.tsx"), "utf-8");
    expect(src).toMatch(/overflow-x-auto[\s\S]*?DIRECTIONS\.map/);
  });

  it("Comparables page reserves enough bottom padding to clear FAB + bottom nav on mobile", () => {
    const src = readFileSync(resolve(root, "pages/Comparables.tsx"), "utf-8");
    // Mobile bottom nav h-14 (56px) + voice FAB w-12 + safe-area inset.
    // pb-32 (128px) clears all of that comfortably.
    expect(src).toMatch(/pb-32\s+md:pb-/);
  });

  it("Hub page reserves bottom padding for mobile (pb-20 minimum)", () => {
    const src = readFileSync(resolve(root, "pages/Hub.tsx"), "utf-8");
    expect(src).toMatch(/pb-(?:20|24|28|32|36|40)\s+md:pb-/);
  });
});


describe("R14.19.step1 — agentExecutor alias routes", () => {
  it("appRouter exposes agentExecutor alongside codeChat (same router instance)", () => {
    const src = readFileSync(resolve(__dirname, "routers.ts"), "utf-8");
    expect(src).toMatch(/codeChat:\s*codeChatRouter,/);
    expect(src).toMatch(/agentExecutor:\s*codeChatRouter,/);
  });

  it("codeChatStream router mounts both /api/codechat/stream and /api/agent-executor/stream on the same handler", () => {
    const src = readFileSync(resolve(__dirname, "routes/codeChatStream.ts"), "utf-8");
    expect(src).toMatch(/codeChatStreamRouter\.post\("\/api\/codechat\/stream",\s*codeChatStreamHandler\)/);
    expect(src).toMatch(/codeChatStreamRouter\.post\("\/api\/agent-executor\/stream",\s*codeChatStreamHandler\)/);
  });
});


describe("R14.17.j — UI polish recursion sweep findings", () => {
  it("every target=\"_blank\" anchor in client/src/**/*.tsx carries rel=\"noopener noreferrer\"", async () => {
    const { readdirSync, statSync } = await import("node:fs");
    const clientRoot = resolve(__dirname, "..", "client", "src");
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const entry of readdirSync(dir)) {
        const full = `${dir}/${entry}`;
        const s = statSync(full);
        if (s.isDirectory()) walk(full);
        else if (entry.endsWith(".tsx")) {
          const src = readFileSync(full, "utf-8");
          for (const line of src.split("\n")) {
            if (line.includes('target="_blank"') && !line.includes("rel=")) {
              offenders.push(`${full}: ${line.trim().slice(0, 120)}`);
            }
          }
        }
      }
    }

    walk(clientRoot);
    expect(offenders, `target="_blank" without rel="noopener noreferrer":\n${offenders.join("\n")}`).toEqual([]);
  });
});


describe("R14.35 — Hub FAB layout shift fix", () => {
  it("Hub.tsx renders the + FAB via createPortal so position:fixed is anchored to document.body", () => {
    const hubSrc = readFileSync(resolve(__dirname, "..", "client", "src", "pages", "Hub.tsx"), "utf-8");
    expect(hubSrc).toContain('import { createPortal } from "react-dom"');
    expect(hubSrc).toMatch(/createPortal\(\s*<button[\s\S]*data-testid="hub-fab"[\s\S]*document\.body/);
  });

  it("Hub.tsx FAB still has the correct viewport-anchored bottom calc with safe-area inset", () => {
    const hubSrc = readFileSync(resolve(__dirname, "..", "client", "src", "pages", "Hub.tsx"), "utf-8");
    expect(hubSrc).toContain('bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))"');
  });
});


describe("R14.36 — Hamburger button opens nav, not /hub redirect", () => {
  it("AppLayout hamburger calls setMobileDrawerOpen on mobile + setSidebarOpen on desktop, never window.location.href", () => {
    const src = readFileSync(resolve(__dirname, "..", "client", "src", "components", "AppLayout.tsx"), "utf-8");
    // Locate the header hamburger button (Menu icon + PanelLeft icon)
    expect(src).toContain('aria-label="Open navigation menu"');
    expect(src).toMatch(/setMobileDrawerOpen\(true\)/);
    expect(src).toMatch(/setSidebarOpen\(true\)/);
    // Ensure the prior R14.15 redirect has been removed from the hamburger handler
    expect(src).not.toMatch(/window\.location\.href\s*=\s*"\/hub"/);
  });
});


describe("R14.37 — Bottom sidebar bar must not contain a duplicate Hub icon", () => {
  it("AppLayout bottom-sidebar action row only contains Settings, Connectors, Help, Theme — no Hub navigation", () => {
    const src = readFileSync(resolve(__dirname, "..", "client", "src", "components", "AppLayout.tsx"), "utf-8");
    // Locate the bottom action row block (between the user-bar opening and the © Stewardly mark)
    const bottomBarMatch = src.match(/glass-sidebar border-t border-sidebar-border shrink-0 bg-sidebar[\s\S]*?© Stewardly/);
    expect(bottomBarMatch, "bottom sidebar action row not found").toBeTruthy();
    const bottomBar = bottomBarMatch![0];
    // The bottom bar must not navigate to /hub via onClick or href
    expect(bottomBar).not.toMatch(/navigate\("\/hub"\)/);
    expect(bottomBar).not.toMatch(/href="\/hub"/);
    // R14.28 marker comment must remain present so future edits are warned
    expect(src).toContain("R14.28: bottom-bar Hub icon removed");
  });
});


describe("R14.38 — GlobalVoiceFAB visible on Home", () => {
  it("GlobalVoiceFAB no longer hides on the / route — only on /chat, /agent-chat, /task/*", () => {
    const src = readFileSync(resolve(__dirname, "..", "client", "src", "components", "GlobalVoiceFAB.tsx"), "utf-8");
    // The route-gating must NOT contain a `location === "/"` clause anymore
    expect(src).not.toMatch(/location\s*===\s*"\/"/);
    // The chat/task gating must still be present
    expect(src).toMatch(/location\.startsWith\("\/chat"\)/);
    expect(src).toMatch(/location\.startsWith\("\/agent-chat"\)/);
    expect(src).toMatch(/location\.startsWith\("\/task\/"\)/);
    // Marker comment so future edits know why
    expect(src).toContain("R14.38");
  });
});
