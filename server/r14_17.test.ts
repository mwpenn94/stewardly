/**
 * R14.17 — voice guardrails deny-list semantics + voiceAgent integration.
 *
 * These tests pin the contract that:
 *   1. The default guardrail is "app-wide except for a small deny-list".
 *   2. global_admin bypasses the deny-list entirely.
 *   3. voiceAgent.ts no longer references the legacy `allowedRoutes`
 *      allowlist when deciding whether to permit a navigate action.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  VOICE_DEFAULT_DENIED_ROUTES,
  HUB_DEFAULT_ALLOWED_ROUTES,
} from "./_core/voiceGuardrails";

describe("R14.17 — deny-list guardrails", () => {
  it("HUB_DEFAULT_ALLOWED_ROUTES is empty (legacy compat only)", () => {
    expect(Array.isArray(HUB_DEFAULT_ALLOWED_ROUTES)).toBe(true);
    expect(HUB_DEFAULT_ALLOWED_ROUTES.length).toBe(0);
  });

  it("VOICE_DEFAULT_DENIED_ROUTES blocks the well-known sensitive surfaces", () => {
    const must = [
      "/api/",
      "/oauth/",
      "/admin/",
      "/platform-admin",
      "/org-admin",
      "/billing/cards",
      "/billing/payment-methods",
      "/settings/secrets",
      "/settings/integrations/connect",
      "/data-room",
      "/governance/keys",
    ];
    for (const m of must) {
      expect(
        VOICE_DEFAULT_DENIED_ROUTES.includes(m),
        `VOICE_DEFAULT_DENIED_ROUTES is missing ${m}`,
      ).toBe(true);
    }
  });

  it("voiceAgent.ts no longer references guard.allowedRoutes (uses isRouteAllowed)", () => {
    const src = readFileSync(
      resolve(__dirname, "routers/voiceAgent.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/guard\.allowedRoutes/);
    expect(src).toMatch(/guard\.isRouteAllowed\(/);
    // System-prompt messaging has flipped to deny-list language.
    expect(src).toMatch(/EXCEPT routes starting with/);
  });
});

describe("R14.17 — AgentBridge runtime diagnostics surface", () => {
  it("AgentBridgeContext shows visible toast for every decided action", () => {
    const src = readFileSync(
      resolve(__dirname, "../client/src/contexts/AgentBridgeContext.tsx"),
      "utf8",
    );
    // Must always toast what was heard so users see the pipeline is alive.
    expect(src).toMatch(/runUtterance heard/);
    expect(src).toMatch(/Heard:/);
    // Must always toast the decided action summary.
    expect(src).toMatch(/describeAction/);
    expect(src).toMatch(/toast\.message\(summary/);
    // open_applet from a non-chat route should pull the user into /agent-chat.
    expect(src).toMatch(/navigate\("\/agent-chat"\)/);
  });

  it("inlineApplet state accepts the dynamic { hubItemId } shape", () => {
    const src = readFileSync(
      resolve(__dirname, "../client/src/contexts/AgentBridgeContext.tsx"),
      "utf8",
    );
    // The state declaration must allow both string and {hubItemId} so dynamic
    // Hub-item embeds aren't silently dropped.
    expect(src).toMatch(
      /useState<string \| \{ hubItemId: number \} \| null>/,
    );
  });
});
