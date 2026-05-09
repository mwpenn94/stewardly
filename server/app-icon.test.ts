/**
 * Regression test: app icon wiring (H_white_marble brand).
 *
 * The icon was previously broken because the /manus-storage/ URLs in
 * client/index.html referenced expired CloudFront-signed objects (HTTP 403).
 * This test pins the new URLs in BOTH client/index.html and
 * client/public/manifest.json and then verifies each one is reachable
 * through the running dev server.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const indexHtml = fs.readFileSync(path.join(ROOT, "client/index.html"), "utf-8");
const manifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "client/public/manifest.json"), "utf-8")
);

const NEW_FAVICON_ICO = "/manus-storage/stewardly-favicon_b0cb4b41.ico";
const NEW_ICON_32 = "/manus-storage/stewardly-icon-32_22a89a09.png";
const NEW_ICON_192 = "/manus-storage/stewardly-icon-192_efef5d08.png";
const NEW_ICON_512 = "/manus-storage/stewardly-icon-512_38e2d307.png";
const NEW_APPLE_TOUCH = "/manus-storage/stewardly-apple-touch-icon-180_e96910c6.png";
const NEW_OG_IMAGE = "/manus-storage/stewardly-og-image_10d069c4.png";

const ALL_ICON_URLS = [
  NEW_FAVICON_ICO,
  NEW_ICON_32,
  NEW_ICON_192,
  NEW_ICON_512,
  NEW_APPLE_TOUCH,
  NEW_OG_IMAGE,
];

describe("App icon wiring — client/index.html", () => {
  it("references the new H/marble favicon.ico", () => {
    expect(indexHtml).toContain(`href="${NEW_FAVICON_ICO}"`);
  });

  it("references the 32px icon", () => {
    expect(indexHtml).toContain(`href="${NEW_ICON_32}"`);
  });

  it("references the 192px icon", () => {
    expect(indexHtml).toContain(`href="${NEW_ICON_192}"`);
  });

  it("references the 512px icon", () => {
    expect(indexHtml).toContain(`href="${NEW_ICON_512}"`);
  });

  it("references the apple-touch-icon", () => {
    expect(indexHtml).toContain(`href="${NEW_APPLE_TOUCH}"`);
  });

  it("references the OG image (og:image and twitter:image)", () => {
    expect(indexHtml).toContain(`<meta property="og:image" content="${NEW_OG_IMAGE}"`);
    expect(indexHtml).toContain(`<meta name="twitter:image" content="${NEW_OG_IMAGE}"`);
  });

  it("declares og:image dimensions for share-card preview", () => {
    expect(indexHtml).toMatch(/og:image:width" content="1200"/);
    expect(indexHtml).toMatch(/og:image:height" content="630"/);
  });

  it("does NOT reference any of the previously expired URLs", () => {
    const expired = [
      "/manus-storage/favicon_256c3658.ico",
      "/manus-storage/favicon-32_6722802f.png",
      "/manus-storage/icon-192_b278a06b.png",
      "/manus-storage/apple-touch-icon_34b64446.png",
      "/manus-storage/icon-512_bdf5e35a.png",
    ];
    for (const url of expired) {
      expect(indexHtml).not.toContain(url);
    }
  });
});

describe("App icon wiring — manifest.json (PWA)", () => {
  it("has 32, 180, 192 (any+maskable), 512 (any+maskable) icons", () => {
    const sizes = (manifest.icons as Array<{ sizes: string; src: string; purpose?: string }>).map(
      (i) => `${i.sizes}${i.purpose ? `:${i.purpose}` : ""}`
    );
    expect(sizes).toContain("32x32");
    expect(sizes).toContain("180x180");
    expect(sizes).toContain("192x192:any");
    expect(sizes).toContain("192x192:maskable");
    expect(sizes).toContain("512x512:any");
    expect(sizes).toContain("512x512:maskable");
  });

  it("all icon URLs point to the new H/marble assets", () => {
    const srcs = (manifest.icons as Array<{ src: string }>).map((i) => i.src);
    for (const src of srcs) {
      expect(src).toMatch(/^\/manus-storage\/stewardly-/);
    }
  });

  it("does NOT reference any of the previously expired URLs", () => {
    const raw = JSON.stringify(manifest);
    expect(raw).not.toContain("favicon-32_6722802f");
    expect(raw).not.toContain("apple-touch-icon_34b64446");
    expect(raw).not.toContain("icon-192_b278a06b");
    expect(raw).not.toContain("icon-512_bdf5e35a");
  });
});

describe("App icon wiring — live HTTP reachability via dev server", () => {
  // Dev server runs at localhost:3000; /manus-storage/* serves a redirect that
  // resolves to the signed CloudFront URL — we follow the redirect and assert 200.
  const BASE = "http://localhost:3000";

  for (const url of ALL_ICON_URLS) {
    it(`GET ${url} resolves to 200 (no expired-signature 403)`, async () => {
      const res = await fetch(`${BASE}${url}`, { redirect: "follow" });
      expect(res.status).toBe(200);
      // Reject HTML error pages slipping through with 200
      const ct = res.headers.get("content-type") ?? "";
      expect(ct).not.toMatch(/text\/html/);
    });
  }
});
