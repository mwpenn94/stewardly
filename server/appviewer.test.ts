/**
 * server/appviewer.test.ts — invariants for the `/apps/:slug` route
 * and the generic AppViewer page.
 *
 * Pure structural checks (no DB needed).
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
function read(p: string): string {
  return readFileSync(resolve(ROOT, p), "utf8");
}

describe("/apps/:slug route registration", () => {
  const app = read("client/src/App.tsx");

  it("lazy-imports the AppViewer page", () => {
    expect(app).toMatch(/const AppViewer = lazy\(\(\) => import\("\.\/pages\/AppViewer"\)\)/);
  });

  it("registers the /apps/:slug route with the slug param wired through", () => {
    expect(app).toMatch(/path="\/apps\/:slug"/);
    expect(app).toMatch(/<AppViewer slug=/);
  });
});

describe("AppViewer surface kinds", () => {
  const src = read("client/src/pages/AppViewer.tsx");

  it("calls trpc.apps.getBySlug and gates on the slug", () => {
    expect(src).toContain("trpc.apps.getBySlug.useQuery");
    expect(src).toMatch(/enabled:\s*!!slug/);
  });

  it("renders a not-found card (not a 404) when the app cannot be resolved", () => {
    expect(src).toMatch(/data-testid={`app-viewer-not-found-/);
    expect(src).toContain("Back to Hub");
  });

  it("supports the 4 manifest kinds: link, iframe, markdown, engine", () => {
    expect(src).toMatch(/manifest\.kind === "link"/);
    expect(src).toMatch(/manifest\.kind === "iframe"/);
    expect(src).toMatch(/manifest\.kind === "markdown"/);
    expect(src).toMatch(/manifest\.kind === "engine"/);
  });

  it("clamps iframe height to a safe range and sandboxes the iframe", () => {
    expect(src).toMatch(/Math\.min\(Math\.max\(manifest\.height \?\? 720, 320\), 1600\)/);
    expect(src).toContain('sandbox="allow-scripts allow-forms allow-same-origin allow-popups"');
  });

  it("uses opaque dual-theme chrome (bg-card/text-card-foreground/border)", () => {
    expect(src).toMatch(/bg-card text-card-foreground border border-border/);
  });

  it("falls back to a 'no surface configured' landing when manifest is empty", () => {
    expect(src).toMatch(/data-testid={`app-viewer-empty-/);
  });
});

describe("apps.getBySlug procedure (publicProcedure with visibility checks)", () => {
  const src = read("server/routers/apps.ts");

  it("exposes getBySlug as a publicProcedure so unauthed visitors can resolve public apps", () => {
    expect(src).toMatch(/getBySlug:\s*publicProcedure/);
  });

  it("public visibility short-circuits without requiring auth", () => {
    expect(src).toMatch(/app\.visibility === "public"[\s\S]{0,80}return \{ app, installed: false \}/);
  });

  it("non-public apps require ctx.user (otherwise NOT_FOUND so we don't leak existence)", () => {
    expect(src).toMatch(/!ctx\.user[\s\S]{0,120}NOT_FOUND/);
  });
});
