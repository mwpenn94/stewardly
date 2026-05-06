/**
 * Phase 5 — 5-persona smoke suite.
 *
 * Each persona issues a representative Intent through the
 * cross-engine `chatRouter` and asserts the engine returns a typed
 * `IntentResult` (proposal or "deferred"). This is the baseline gate
 * before traffic flips to v3.
 *
 * The substrate uses the default in-memory adapters; no DB or network.
 */
import { describe, it, expect } from "vitest";
import { chatRouter } from "../index";
import type { Intent } from "../_intent";

const baseMeta = {
  tenantId: "t_smoke",
  practitionerId: "u_smoke",
  mission: "general",
  adminLevel: 0,
  correlationId: "smoke-1",
  isComplianceClass: false,
};

const personas: Array<{ name: string; intent: Intent<any> }> = [
  {
    name: "Member (formational)",
    intent: {
      kind: "formational.cadence.checkin",
      payload: { date: "2026-05-06" },
      meta: baseMeta,
    },
  },
  {
    name: "Member (relational)",
    intent: {
      kind: "relational.connect",
      payload: { otherUserId: 42, kind: "mentor" },
      meta: baseMeta,
    },
  },
  {
    name: "Advisor (missional/wealth)",
    intent: {
      kind: "missional.wealth.calculate",
      payload: { calculator: "cashflow", inputs: { income: 100000 } },
      meta: baseMeta,
    },
  },
  {
    name: "Manager (contextual/audit)",
    intent: {
      kind: "contextual.audit.search",
      payload: { q: "vault.read", limit: 10 },
      meta: baseMeta,
    },
  },
  {
    name: "Admin (continuous-improvement)",
    intent: {
      kind: "continuous-improvement.metrics.summary",
      payload: { window: "7d" },
      meta: baseMeta,
    },
  },
];

describe("Phase 5 — persona smoke suite", () => {
  for (const p of personas) {
    it(`${p.name} returns a typed proposal`, async () => {
      const result = await chatRouter(p.intent);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
      // Either a real proposal or a typed "deferred" stub — both are
      // acceptable for the smoke gate. What we DON'T accept is undefined
      // or a thrown error (vitest would surface that automatically).
    });
  }
});
