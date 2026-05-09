/**
 * Quantic Section 7 boundary — Wave B.2
 * ======================================
 *
 * Stewardly's most-inviolable architectural constraint. The Quantic EMBA
 * Section 7 Terms of Service prohibit automated/programmatic interaction
 * with `onlinelearning.quantic.edu` and any Quantic-proprietary content
 * surface. We therefore enforce an UNCONDITIONAL refusal at the substrate
 * router boundary — it has no admin-level escape hatch, no tenant override,
 * no feature flag.
 *
 * STEWARDLY v3 §3 line:
 *   "Refuse any EMBA Section 7 ToS-touching intent unconditionally."
 *
 * v3 §7.1 (verbatim):
 *   "Quantic Section 7 boundary is inviolable: unconditional refusal,
 *    no exceptions."
 *
 * This module is the single executable enforcement point. Every code path
 * that dispatches an Intent must call `assertQuanticBoundary(intent)` (or
 * use the `quanticGuard` helper which returns a refusal IntentResult)
 * before any provider-side action.
 *
 * --------------------------------------------------------------------
 * BLOCK-LIST DESIGN
 * --------------------------------------------------------------------
 * The list deliberately catches every plausible spelling, encoding, and
 * paraphrase of the protected surface. Each pattern is a normalized
 * lower-case substring that we test against a recursively flattened
 * representation of the intent kind + payload. We use substring matching
 * (not regex with anchoring) so any payload field — URL, prompt, tool
 * argument, attachment text — that mentions the boundary triggers a refusal.
 *
 * The block-list is exported so tests can assert exhaustiveness.
 * --------------------------------------------------------------------
 */

import { randomUUID } from "node:crypto";
import type { Intent, IntentResult } from "./_intent";
import { emptyCost } from "./_intent";

/**
 * The exhaustive Quantic Section 7 block-list. Each entry must be lower-case.
 * New entries MUST be appended (never reordered) to keep audit history stable.
 */
export const QUANTIC_BLOCK_LIST: readonly string[] = [
  // Primary domain (canonical)
  "onlinelearning.quantic.edu",
  // Subdomain / path variants
  "onlinelearning.quantic",
  "quantic.edu/onlinelearning",
  // Bare-domain references
  "quantic.edu",
  "quanticschool.com",
  "quanticschool",
  // Section 7 ToS phrasings
  "emba section 7",
  "emba section seven",
  "quantic section 7",
  "quantic section seven",
  "quantic tos section 7",
  "quantic terms section 7",
  // Programmatic-access intent phrasings
  "scrape quantic",
  "scrape onlinelearning",
  "automate quantic",
  "automate onlinelearning",
  "quantic api scrape",
  "quantic course download",
  "download quantic course",
  "quantic content extract",
  "extract quantic course",
  // Common ToS-violating verbs paired with the protected surface
  "crawl quantic",
  "crawl onlinelearning.quantic",
  "headless browser quantic",
  "headless browser onlinelearning",
  "playwright quantic",
  "puppeteer quantic",
  "selenium quantic",
] as const;

/**
 * Refusal error code emitted by the boundary. Used by tests and audit.
 */
export const QUANTIC_REFUSAL_CODE = "EMBA_SECTION_7_BOUNDARY";

/**
 * Refusal message — verbatim. Do not paraphrase per substrate audit rules;
 * the precise string is part of the audit trail's integrity guarantee.
 */
export const QUANTIC_REFUSAL_MESSAGE =
  "Stewardly: EMBA Section 7 ToS boundary refused (v3 §7.1).";

/**
 * Recursively serialize any value into a single lower-case search string.
 * Captures every primitive that could carry a Section-7 reference no
 * matter how deeply nested.
 */
export function flattenForBoundaryScan(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value).toLowerCase();
  }
  if (Array.isArray(value)) {
    return value.map(flattenForBoundaryScan).join(" ");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.entries(obj)
      .map(([k, v]) => `${k.toLowerCase()} ${flattenForBoundaryScan(v)}`)
      .join(" ");
  }
  return "";
}

/**
 * Returns the first matching block-list entry, or `null` if the intent is
 * clear. Pure (no side effects); safe to call from estimate paths.
 */
export function findQuanticBoundaryHit(intent: Intent<unknown>): string | null {
  const haystack = `${intent.kind.toLowerCase()} ${flattenForBoundaryScan(intent.payload)}`;
  for (const needle of QUANTIC_BLOCK_LIST) {
    if (haystack.includes(needle)) return needle;
  }
  return null;
}

/**
 * Throws if the intent crosses the boundary. Use in code paths that should
 * reject loudly (e.g., direct programmatic calls in tests/CI).
 */
export function assertQuanticBoundary(intent: Intent<unknown>): void {
  const hit = findQuanticBoundaryHit(intent);
  if (hit) {
    throw new Error(
      `${QUANTIC_REFUSAL_MESSAGE} (matched: "${hit}", kind: ${intent.kind})`,
    );
  }
}

/**
 * Returns a refusal IntentResult if the intent crosses the boundary, or
 * `null` if the intent is clear to proceed. Used by the substrate router
 * to refuse with an audit-bearing IntentResult instead of throwing.
 */
export function quanticGuard(intent: Intent<unknown>): IntentResult<never> | null {
  const hit = findQuanticBoundaryHit(intent);
  if (!hit) return null;
  return {
    ok: false,
    error: { code: QUANTIC_REFUSAL_CODE, message: QUANTIC_REFUSAL_MESSAGE },
    invoked: [],
    cost: emptyCost(),
    auditId: randomUUID(),
  };
}
