import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("Global glass treatment — every shadcn surface is glass by default", () => {
  it("Card primitive uses glass-card (so every Card across the app inherits glass)", () => {
    const card = read("client/src/components/ui/card.tsx");
    expect(card).toContain("glass-card");
    expect(card).not.toMatch(/"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"/);
  });

  it("Popover content uses glass-card (frosted menus everywhere)", () => {
    const popover = read("client/src/components/ui/popover.tsx");
    expect(popover).toContain("glass-card");
    expect(popover).not.toMatch(/^\s*"bg-popover text-popover-foreground/m);
  });

  it("DropdownMenu content uses glass-card (frosted dropdown menus)", () => {
    const dd = read("client/src/components/ui/dropdown-menu.tsx");
    expect(dd).toContain("glass-card");
    expect(dd).not.toMatch(/"bg-popover text-popover-foreground.*rounded-md border p-1 shadow-md"/);
  });

  it("HoverCard content uses glass-card (frosted hover popovers)", () => {
    const hc = read("client/src/components/ui/hover-card.tsx");
    expect(hc).toContain("glass-card");
    expect(hc).not.toMatch(/"bg-popover text-popover-foreground.*rounded-md border p-4 shadow-md outline-hidden"/);
  });

  it("Sheet uses glass-modal for content and glass-overlay for backdrop", () => {
    const sheet = read("client/src/components/ui/sheet.tsx");
    expect(sheet).toContain("glass-modal");
    expect(sheet).toContain("glass-overlay");
    expect(sheet).not.toContain('"bg-background data-[state=open]:animate-in');
    expect(sheet).not.toContain("bg-black/50");
  });

  it("Dialog uses glass-modal for content and glass-overlay for backdrop", () => {
    const dialog = read("client/src/components/ui/dialog.tsx");
    expect(dialog).toContain("glass-modal");
    expect(dialog).toContain("glass-overlay");
  });

  it("AlertDialog uses glass-modal for content and glass-overlay for backdrop", () => {
    const ad = read("client/src/components/ui/alert-dialog.tsx");
    expect(ad).toContain("glass-modal");
    expect(ad).toContain("glass-overlay");
    expect(ad).not.toContain("bg-black/50");
  });

  it("Drawer uses glass-modal for content and glass-overlay for backdrop", () => {
    const drawer = read("client/src/components/ui/drawer.tsx");
    expect(drawer).toContain("glass-modal");
    expect(drawer).toContain("glass-overlay");
    expect(drawer).not.toContain("group/drawer-content bg-background fixed");
    expect(drawer).not.toContain("bg-black/50");
  });

  it("Glass utility tokens exist in index.css with correct backdrop-filter recipe", () => {
    const css = read("client/src/index.css");
    expect(css).toMatch(/\.glass-card\s*\{/);
    expect(css).toMatch(/\.glass-modal\s*\{/);
    expect(css).toMatch(/\.glass-overlay\s*\{/);
    expect(css).toMatch(/\.glass-sidebar\s*\{/);
    expect(css).toMatch(/backdrop-filter:\s*blur\(/);
    expect(css).toMatch(/saturate\(/);
  });
});
