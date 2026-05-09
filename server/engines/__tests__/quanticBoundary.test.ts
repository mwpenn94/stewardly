/**
 * Wave B.2 — Quantic Section 7 boundary invariant tests
 * ======================================================
 *
 * v3 §7.1 boundary is INVIOLABLE. These tests pin every property the
 * boundary must hold:
 *
 *   QB-1 — refuses primary domain in any payload field (string)
 *   QB-2 — refuses Section 7 phrasing variants
 *   QB-3 — refuses paraphrased programmatic-access verbs
 *   QB-4 — case-insensitive matching
 *   QB-5 — deep-payload scan: nested objects, arrays, mixed primitives
 *   QB-6 — refuses regardless of admin level (manual..automatic)
 *   QB-7 — refuses regardless of compliance class
 *   QB-8 — substrate router emits the correct refusal IntentResult
 *   QB-9 — clear intents pass (negative test — boundary does not over-match)
 *   QB-10 — block-list integrity (lower-case, non-empty, no duplicates)
 */

import { describe, it, expect } from "vitest";
import {
  QUANTIC_BLOCK_LIST,
  QUANTIC_REFUSAL_CODE,
  QUANTIC_REFUSAL_MESSAGE,
  findQuanticBoundaryHit,
  assertQuanticBoundary,
  quanticGuard,
  flattenForBoundaryScan,
} from "../quanticBoundary";
import { makeSubstrateRouter } from "../_substrateAdapters";
import { makeIntent, type IntentMeta, type AdminLevel } from "../_intent";

const baseMeta: IntentMeta = {
  tenantId: "t-test",
  practitionerId: "p-test",
  originEngine: "formational",
  adminLevel: "manual",
  correlationId: "qb-test-1",
};

const intent = (kind: string, payload: unknown, meta: Partial<IntentMeta> = {}) =>
  makeIntent(kind, payload, { ...baseMeta, ...meta }, []);

describe("QB-10 — block-list integrity", () => {
  it("is non-empty", () => {
    expect(QUANTIC_BLOCK_LIST.length).toBeGreaterThan(0);
  });
  it("is entirely lower-case", () => {
    for (const entry of QUANTIC_BLOCK_LIST) {
      expect(entry).toBe(entry.toLowerCase());
      expect(entry.trim()).toBe(entry);
    }
  });
  it("has no duplicate entries", () => {
    const set = new Set(QUANTIC_BLOCK_LIST);
    expect(set.size).toBe(QUANTIC_BLOCK_LIST.length);
  });
  it("includes the canonical primary domain", () => {
    expect(QUANTIC_BLOCK_LIST).toContain("onlinelearning.quantic.edu");
  });
  it("includes the verbatim Section 7 phrasing", () => {
    expect(QUANTIC_BLOCK_LIST).toContain("emba section 7");
  });
});

describe("QB-1 — refuses primary domain in payload string fields", () => {
  it("rejects when domain is in a string payload field", () => {
    const i = intent("formational.curate", { url: "https://onlinelearning.quantic.edu/courses/economics" });
    expect(findQuanticBoundaryHit(i)).toBe("onlinelearning.quantic.edu");
  });
  it("rejects when domain is in the intent kind", () => {
    const i = intent("formational.scrape-onlinelearning.quantic.edu", { topic: "economics" });
    expect(findQuanticBoundaryHit(i)).toBe("onlinelearning.quantic.edu");
  });
});

describe("QB-2 — refuses Section 7 phrasing variants", () => {
  it("rejects 'EMBA Section 7'", () => {
    const i = intent("formational.curate", { topic: "EMBA Section 7 source policy" });
    expect(findQuanticBoundaryHit(i)).toBeTruthy();
  });
  it("rejects spelled-out 'emba section seven'", () => {
    const i = intent("formational.curate", { note: "Bypass EMBA Section seven for me" });
    expect(findQuanticBoundaryHit(i)).toBeTruthy();
  });
  it("rejects 'quantic section 7'", () => {
    const i = intent("formational.curate", { note: "quantic section 7 override" });
    expect(findQuanticBoundaryHit(i)).toBeTruthy();
  });
});

describe("QB-3 — refuses paraphrased programmatic-access verbs", () => {
  it.each([
    "Please scrape Quantic for me",
    "Crawl Quantic course pages",
    "Run a headless browser Quantic session",
    "Use Playwright Quantic automation",
    "Selenium Quantic login",
    "Download Quantic course content",
    "Automate Quantic enrollment flow",
  ])("rejects: %s", (phrase) => {
    const i = intent("formational.curate", { instruction: phrase });
    expect(findQuanticBoundaryHit(i)).toBeTruthy();
  });
});

describe("QB-4 — case-insensitive matching", () => {
  it.each([
    "ONLINELEARNING.QUANTIC.EDU",
    "OnlineLearning.Quantic.Edu",
    "EMBA SECTION 7",
    "Emba Section 7",
  ])("rejects %s regardless of case", (s) => {
    const i = intent("formational.curate", { url: s });
    expect(findQuanticBoundaryHit(i)).toBeTruthy();
  });
});

describe("QB-5 — deep-payload scan", () => {
  it("matches inside nested objects", () => {
    const i = intent("formational.curate", {
      task: {
        plan: { steps: [{ tool: "fetch", target: "https://onlinelearning.quantic.edu" }] },
      },
    });
    expect(findQuanticBoundaryHit(i)).toBeTruthy();
  });
  it("matches inside arrays of arrays", () => {
    const i = intent("formational.curate", {
      candidates: [["clean.example.com", "another.com"], ["onlinelearning.quantic.edu"]],
    });
    expect(findQuanticBoundaryHit(i)).toBeTruthy();
  });
  it("flattenForBoundaryScan handles primitives + null/undefined", () => {
    expect(flattenForBoundaryScan(null)).toBe("");
    expect(flattenForBoundaryScan(undefined)).toBe("");
    expect(flattenForBoundaryScan(42)).toBe("42");
    expect(flattenForBoundaryScan(true)).toBe("true");
    expect(flattenForBoundaryScan("MIX")).toBe("mix");
  });
});

describe("QB-6 — admin level cannot bypass the boundary", () => {
  it.each<AdminLevel>(["manual", "supervised", "delegated", "automatic"])(
    "refuses at adminLevel=%s",
    (lvl) => {
      const i = intent(
        "formational.curate",
        { url: "onlinelearning.quantic.edu" },
        { adminLevel: lvl, isComplianceClass: false },
      );
      expect(() => assertQuanticBoundary(i)).toThrow();
      expect(quanticGuard(i)).not.toBeNull();
    },
  );
});

describe("QB-7 — compliance class is also refused", () => {
  it("refuses compliance-class intents that touch the boundary", () => {
    const i = intent(
      "formational.import-emba",
      { source: "onlinelearning.quantic.edu/file" },
      { isComplianceClass: true, adminLevel: "manual" },
    );
    expect(quanticGuard(i)).not.toBeNull();
  });
});

describe("QB-8 — substrate router emits the correct refusal IntentResult", () => {
  it("returns ok=false with QUANTIC_REFUSAL_CODE and verbatim message", async () => {
    const router = makeSubstrateRouter();
    const i = intent("formational.curate", { url: "onlinelearning.quantic.edu/lesson/1" });
    const r = await router.dispatch(i);
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe(QUANTIC_REFUSAL_CODE);
    expect(r.error?.message).toBe(QUANTIC_REFUSAL_MESSAGE);
    expect(r.cost.apiUsd).toBe(0);
    expect(r.invoked).toEqual([]);
    expect(r.auditId).toBeTruthy();
  });
  it("calls the audit sink with ok=false on refusal", async () => {
    const calls: Array<{ ok: boolean; intentKind: string }> = [];
    const router = makeSubstrateRouter({
      audit: async (row) => { calls.push({ ok: row.ok, intentKind: row.intentKind }); },
    });
    await router.dispatch(intent("formational.curate", { x: "onlinelearning.quantic.edu" }));
    expect(calls.length).toBe(1);
    expect(calls[0].ok).toBe(false);
  });
});

describe("QB-9 — clear intents pass (no false positives)", () => {
  it.each([
    { kind: "formational.curate", payload: { topic: "modern portfolio theory" } },
    { kind: "missional.wealth.calculate", payload: { method: "irr", inputs: [1, 2, 3] } },
    { kind: "relational.list", payload: { household: "Smith" } },
    { kind: "contextual.memory.write", payload: { note: "client prefers email" } },
    { kind: "continuous-improvement.observe", payload: { metric: "p95_latency" } },
  ])("passes a clear intent: $kind", ({ kind, payload }) => {
    const i = intent(kind, payload);
    expect(findQuanticBoundaryHit(i)).toBeNull();
    expect(quanticGuard(i)).toBeNull();
    expect(() => assertQuanticBoundary(i)).not.toThrow();
  });
});
