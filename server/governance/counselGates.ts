/**
 * Wave C-3 — Counsel-review gates
 * =================================
 *
 * Commitment C-17: every customer-facing claim or activation that
 * counsel must review before publication is a typed `counsel:` flag in
 * a single namespace. When any flag is `pending`, a structured
 * `surface_to_user` event is emitted so the user (the operator) can
 * triage the queue. When a flag is `cleared`, the gated capability is
 * unlocked. When a flag is `blocked`, the gated capability stays
 * disabled and the surface message tells the user why.
 *
 * The seven canonical gates per PHASE1_BRIEF.md §C-3:
 *
 *   CG-1  Aggregate-assumption M&V methodology (Stage 1 projection)
 *   CG-2  Guarantee language for Tier-3 sign-offs
 *   CG-3  BYOM terms-stacking (multi-provider terms compatibility)
 *   CG-4  Stewardship public claims (marketing language)
 *   CG-5  Phase 11 memory data flows (cross-tenant memory portability)
 *   CG-6  Phase 12 spectrum activation (Automatic-rung activation)
 *   CG-7  Compliance memo addenda (regulated-industry rider)
 *
 * `surface_to_user` events are written to the existing audit/notification
 * pipeline by the surface-emitter. This module is pure and exposes:
 *
 *   - `CounselGateId` enum (the seven IDs)
 *   - `CounselGateState` type ("pending" | "cleared" | "blocked")
 *   - `CounselGateRecord` shape (id, state, lastUpdatedAt, reviewer, note)
 *   - `requireGateCleared(state)` helper that throws on non-cleared
 *   - `pendingGates(records)` helper that returns the surface payload
 */

export type CounselGateId =
  | "CG-1-aggregate-assumption-mnv"
  | "CG-2-tier3-guarantee-language"
  | "CG-3-byom-terms-stacking"
  | "CG-4-stewardship-public-claims"
  | "CG-5-phase11-memory-data-flows"
  | "CG-6-phase12-spectrum-automatic"
  | "CG-7-compliance-memo-addenda";

export const ALL_GATES: readonly CounselGateId[] = [
  "CG-1-aggregate-assumption-mnv",
  "CG-2-tier3-guarantee-language",
  "CG-3-byom-terms-stacking",
  "CG-4-stewardship-public-claims",
  "CG-5-phase11-memory-data-flows",
  "CG-6-phase12-spectrum-automatic",
  "CG-7-compliance-memo-addenda",
];

export type CounselGateState = "pending" | "cleared" | "blocked";

export interface CounselGateRecord {
  id: CounselGateId;
  state: CounselGateState;
  /** ms-since-epoch of the last state change. */
  lastUpdatedAt: number;
  /** Optional reviewer identity (counsel) for audit. */
  reviewer?: string;
  /** Free-form note for the surface message. */
  note?: string;
}

export class CounselGateNotCleared extends Error {
  readonly code = "COUNSEL_GATE_NOT_CLEARED";
  constructor(public readonly gateId: CounselGateId, public readonly state: CounselGateState) {
    super(`Counsel gate ${gateId} is ${state}; capability is locked until counsel clears it.`);
    this.name = "CounselGateNotCleared";
  }
}

export function requireGateCleared(record: CounselGateRecord): void {
  if (record.state !== "cleared") {
    throw new CounselGateNotCleared(record.id, record.state);
  }
}

/**
 * Build the surface-to-user payload for the operator queue. Tells the
 * operator which gates are pending, when they entered pending state,
 * and the most recent reviewer note (if any).
 */
export interface PendingGateSurfacePayload {
  pending: CounselGateRecord[];
  blocked: CounselGateRecord[];
  /** ms-since-epoch when the surface was generated. */
  generatedAt: number;
}

export function pendingGates(records: readonly CounselGateRecord[]): PendingGateSurfacePayload {
  const pending = records.filter((r) => r.state === "pending");
  const blocked = records.filter((r) => r.state === "blocked");
  return { pending, blocked, generatedAt: Date.now() };
}

/**
 * Default starting state: every gate is pending until counsel clears.
 * Used by tRPC procedures and tests as a safe initial value.
 */
export function defaultGateRecords(now: number = Date.now()): CounselGateRecord[] {
  return ALL_GATES.map((id) => ({ id, state: "pending" as CounselGateState, lastUpdatedAt: now }));
}
