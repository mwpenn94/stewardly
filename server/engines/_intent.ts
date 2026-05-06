/**
 * Stewardly Intent contract — STEWARDLY v3 §3
 * ============================================
 *
 * Engines never import other engines. Engines never call substrate primitives
 * directly. Every cross-engine and engine→substrate request flows through
 * the Intent contract defined here, gated by the local classifier.
 *
 * The contract has three layers:
 *
 *   1. Intent           — what the user / engine wants to do (a typed message)
 *   2. SubstrateRouter  — the gateway that classifies, costs, and dispatches
 *                          intents to the eight substrate primitives
 *   3. EngineContext    — the per-request handle each engine receives, which
 *                          carries tenancy, identity, audit, and the router
 *
 * The classifier is always LOCAL and gates everything. Provider-side LLMs are
 * a substrate detail; the classifier is not.
 */

import type { Stewardship } from "./_substrate";

/* ------------------------------------------------------------------ *
 * Engine and substrate identifiers (stable wire types)               *
 * ------------------------------------------------------------------ */

export type EngineId =
  | "formational"
  | "relational"
  | "missional"
  | "contextual"
  | "continuous-improvement";

export type MissionId =
  | "wealth"
  | "pastoral"
  | "teaching"
  | "healthcare"
  | "coaching"
  | "community";

export type SubstratePrimitive =
  | "chat-surface"
  | "agentic-runtime"
  | "rag"
  | "embeddings"
  | "voice"
  | "document-intelligence"
  | "classifier"
  | "proposal-generator";

/**
 * Administrative spectrum (v3 §3, "administrative spectrum").
 * The compliance class is permanently excluded from "automatic".
 */
export type AdminLevel = "manual" | "supervised" | "delegated" | "automatic";

/* ------------------------------------------------------------------ *
 * Intent envelope                                                     *
 * ------------------------------------------------------------------ */

export interface IntentMeta {
  /** Tenant whose data and policy apply to this intent. */
  tenantId: string;
  /** Practitioner (user) raising the intent. */
  practitionerId: string;
  /** Engine that is the *owner* of this intent. */
  originEngine: EngineId;
  /** Optional: mission specialization (only meaningful for missional). */
  mission?: MissionId;
  /** Administrative level the practitioner has authorized for this class. */
  adminLevel: AdminLevel;
  /** Free-form correlation id for tracing the intent across substrate calls. */
  correlationId: string;
  /** Whether the intent class is "compliance"; if true, automatic is forbidden. */
  isComplianceClass?: boolean;
}

export interface Intent<TPayload = unknown> {
  /** Stable kind for routing, e.g. "formational.curate", "missional.wealth.calculate". */
  kind: string;
  /** Substrate primitives the intent expects to consume (advisory hint). */
  expects: SubstratePrimitive[];
  /** Domain payload. */
  payload: TPayload;
  /** Tenancy + identity + audit metadata. */
  meta: IntentMeta;
}

/* ------------------------------------------------------------------ *
 * Intent results                                                      *
 * ------------------------------------------------------------------ */

export interface IntentCost {
  /** All categories that pass v3 §3's six-pass cost-measurement criterion. */
  apiUsd: number;
  bandwidthUsd: number;
  storageUsd: number;
  hardwareUsd: number;
  electricityUsd: number;
  perSeatDisplacedUsd: number;
}

export interface IntentResult<TData = unknown> {
  ok: boolean;
  data?: TData;
  error?: { code: string; message: string };
  /** Substrate primitives actually invoked (for audit). */
  invoked: SubstratePrimitive[];
  /** Real measured cost (post-classification). */
  cost: IntentCost;
  /** Quality score 0..1 (substrate-emitted). */
  qualityScore?: number;
  /** Audit-trail token written to the Contextual engine. */
  auditId: string;
}

/* ------------------------------------------------------------------ *
 * The substrate router                                                *
 * ------------------------------------------------------------------ */

export interface SubstrateRouter {
  /**
   * Dispatch an intent. Implementations MUST:
   *   1. Classify locally (no remote call) before any provider invocation.
   *   2. Apply the conflict-of-interest architecture (0% markup,
   *      provider-neutral, classifier-minimised cost).
   *   3. Refuse compliance-class intents at adminLevel="automatic".
   *   4. Refuse any EMBA Section 7 ToS-touching intent unconditionally.
   *   5. Write an audit row into the Contextual engine.
   */
  dispatch<TPayload, TData = unknown>(
    intent: Intent<TPayload>,
  ): Promise<IntentResult<TData>>;

  /**
   * Diagnostics: cheapest classifier estimate of cost without executing.
   * Used by the proposal-generator and the BYOM single-button-press setup
   * agent. MUST not invoke any provider-side network call.
   */
  estimate<TPayload>(intent: Intent<TPayload>): Promise<IntentCost>;
}

/* ------------------------------------------------------------------ *
 * Engine context                                                      *
 * ------------------------------------------------------------------ */

export interface EngineContext {
  /** Stable identity of the engine receiving this context. */
  engineId: EngineId;
  /** Per-request tenancy + identity. */
  meta: Omit<IntentMeta, "originEngine">;
  /** Substrate router (the only way to leave the engine). */
  substrate: SubstrateRouter;
  /** Stewardship (tenant policies / brand language / counsel-reviewed flags). */
  stewardship: Stewardship;
  /** Logger scoped to (tenantId, engineId, correlationId). */
  log: (level: "debug" | "info" | "warn" | "error", message: string, fields?: Record<string, unknown>) => void;
}

/* ------------------------------------------------------------------ *
 * Engine handler shape                                                *
 * ------------------------------------------------------------------ */

/**
 * Every engine exports a default handler function with this shape.
 * Engines are pure consumers of substrate; they never reach across to
 * another engine — cross-engine queries route through chat-router.
 *
 * Note: the contract is intentionally non-generic at the type level — the
 * intent kind is the runtime type discriminator, and engines branch on it
 * to produce the appropriate response shape. Callers that need a typed
 * return cast through the kind-to-result map at the call site.
 */
export type EngineHandler = (
  ctx: EngineContext,
  intent: Intent<unknown>,
) => Promise<IntentResult<unknown>>;

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */

export function makeIntent<TPayload>(
  kind: string,
  payload: TPayload,
  meta: IntentMeta,
  expects: SubstratePrimitive[] = [],
): Intent<TPayload> {
  return { kind, expects, payload, meta };
}

export function emptyCost(): IntentCost {
  return {
    apiUsd: 0,
    bandwidthUsd: 0,
    storageUsd: 0,
    hardwareUsd: 0,
    electricityUsd: 0,
    perSeatDisplacedUsd: 0,
  };
}

export function totalCostUsd(c: IntentCost): number {
  return (
    c.apiUsd +
    c.bandwidthUsd +
    c.storageUsd +
    c.hardwareUsd +
    c.electricityUsd +
    c.perSeatDisplacedUsd
  );
}

/**
 * Compliance-class guard. v3 §3: compliance class is permanently excluded
 * from adminLevel="automatic". Use as the first line in any engine that
 * touches compliance-class intents.
 */
export function assertComplianceAdminAllowed(meta: IntentMeta): void {
  if (meta.isComplianceClass && meta.adminLevel === "automatic") {
    throw new Error(
      "Stewardly: compliance-class intents are permanently excluded from automatic admin level (v3 §3).",
    );
  }
}
