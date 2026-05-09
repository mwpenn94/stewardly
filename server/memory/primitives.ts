/**
 * Wave D — Memory primitives M1–M8
 * ===================================
 *
 * Commitment C-19 / C-20: the platform's memory substrate is built
 * from eight named primitives that are explicit, classified, and
 * governed. Every memory write must declare the primitive it belongs
 * to so retention, portability, and right-to-forget rules apply
 * uniformly.
 *
 *   M1  ConversationalShortTerm      — within-task context window
 *   M2  ConversationalLongTerm       — cross-task user-recall items
 *   M3  WorkflowState                — in-flight task/plan state
 *   M4  ProfessionalKnowledge        — methodology/specialty knowledge
 *   M5  ClientContext                — client-specific facts (scoped to client)
 *   M6  RegulatoryEvidence           — items needed for audit/compliance
 *   M7  PerformanceMetrics           — measured outcomes (M&V evidence)
 *   M8  PortableProfile              — user-portable memory bundle
 *
 * Each primitive has:
 *   - classification (PII, PHI, financial, regulatory, none)
 *   - retention policy (default TTL in days)
 *   - portability (whether included in M8 PortableProfile export)
 *   - right-to-forget (whether erasable on user request without legal
 *     review — RegulatoryEvidence is NOT, others are)
 *
 * Module exports:
 *   - `MemoryPrimitiveId` enum
 *   - `MEMORY_PRIMITIVE_POLICY` table
 *   - `classifyEntry(primitiveId)` returns the classification
 *   - `assertPortable(primitiveId)` throws when non-portable
 *   - `assertErasable(primitiveId)` throws when non-erasable
 *   - `expirationFor(primitiveId, createdAt)` ms-since-epoch for TTL
 *   - `buildPortableProfile(entries)` builds the M8 export bundle
 */

export type MemoryPrimitiveId =
  | "M1.ConversationalShortTerm"
  | "M2.ConversationalLongTerm"
  | "M3.WorkflowState"
  | "M4.ProfessionalKnowledge"
  | "M5.ClientContext"
  | "M6.RegulatoryEvidence"
  | "M7.PerformanceMetrics"
  | "M8.PortableProfile";

export const ALL_PRIMITIVES: readonly MemoryPrimitiveId[] = [
  "M1.ConversationalShortTerm",
  "M2.ConversationalLongTerm",
  "M3.WorkflowState",
  "M4.ProfessionalKnowledge",
  "M5.ClientContext",
  "M6.RegulatoryEvidence",
  "M7.PerformanceMetrics",
  "M8.PortableProfile",
];

export type MemoryClassification = "none" | "pii" | "phi" | "financial" | "regulatory";

export interface MemoryPrimitivePolicy {
  id: MemoryPrimitiveId;
  classification: MemoryClassification;
  /** Default TTL in days. 0 = no expiration. */
  retentionDays: number;
  /** Whether this primitive is included in the user's M8 portable export. */
  portable: boolean;
  /** Whether this primitive is erasable on user-initiated right-to-forget. */
  erasable: boolean;
  /** Human-readable description for UI/audit. */
  description: string;
}

export const MEMORY_PRIMITIVE_POLICY: Record<MemoryPrimitiveId, MemoryPrimitivePolicy> = {
  "M1.ConversationalShortTerm": {
    id: "M1.ConversationalShortTerm",
    classification: "none",
    retentionDays: 7,
    portable: false,
    erasable: true,
    description: "Within-task context window. Auto-purged after 7 days.",
  },
  "M2.ConversationalLongTerm": {
    id: "M2.ConversationalLongTerm",
    classification: "pii",
    retentionDays: 365,
    portable: true,
    erasable: true,
    description: "Cross-task user-recall items (preferences, ongoing topics).",
  },
  "M3.WorkflowState": {
    id: "M3.WorkflowState",
    classification: "none",
    retentionDays: 90,
    portable: false,
    erasable: true,
    description: "In-flight task/plan state. Required for resumability.",
  },
  "M4.ProfessionalKnowledge": {
    id: "M4.ProfessionalKnowledge",
    classification: "none",
    retentionDays: 0, // perpetual
    portable: true,
    erasable: true,
    description: "Methodology/specialty knowledge curated by the practitioner.",
  },
  "M5.ClientContext": {
    id: "M5.ClientContext",
    classification: "pii",
    retentionDays: 365 * 7, // 7 years (typical client-record retention)
    portable: true,
    erasable: true,
    description: "Client-specific facts scoped to a single client.",
  },
  "M6.RegulatoryEvidence": {
    id: "M6.RegulatoryEvidence",
    classification: "regulatory",
    retentionDays: 365 * 7, // 7 years
    portable: false,
    erasable: false, // requires counsel review per CG-7
    description: "Audit/compliance evidence. Erasure requires counsel review.",
  },
  "M7.PerformanceMetrics": {
    id: "M7.PerformanceMetrics",
    classification: "financial",
    retentionDays: 365 * 7,
    portable: true,
    erasable: false, // M&V tracker integrity
    description: "Measured outcomes; the M&V evidence backbone.",
  },
  "M8.PortableProfile": {
    id: "M8.PortableProfile",
    classification: "pii",
    retentionDays: 0,
    portable: true,
    erasable: true,
    description: "User-portable memory bundle (the export wrapper).",
  },
};

export class NotPortableError extends Error {
  readonly code = "NOT_PORTABLE";
  constructor(public readonly id: MemoryPrimitiveId) {
    super(`Memory primitive ${id} is not portable; cannot be included in M8 export.`);
    this.name = "NotPortableError";
  }
}

export class NotErasableError extends Error {
  readonly code = "NOT_ERASABLE";
  constructor(public readonly id: MemoryPrimitiveId) {
    super(`Memory primitive ${id} is not user-erasable; right-to-forget requires counsel review.`);
    this.name = "NotErasableError";
  }
}

export function classifyEntry(id: MemoryPrimitiveId): MemoryClassification {
  return MEMORY_PRIMITIVE_POLICY[id].classification;
}

export function assertPortable(id: MemoryPrimitiveId): void {
  if (!MEMORY_PRIMITIVE_POLICY[id].portable) throw new NotPortableError(id);
}

export function assertErasable(id: MemoryPrimitiveId): void {
  if (!MEMORY_PRIMITIVE_POLICY[id].erasable) throw new NotErasableError(id);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Returns ms-since-epoch when the entry expires, or null for perpetual. */
export function expirationFor(id: MemoryPrimitiveId, createdAt: number): number | null {
  const days = MEMORY_PRIMITIVE_POLICY[id].retentionDays;
  if (days === 0) return null;
  return createdAt + days * DAY_MS;
}

/* ------------------------------------------------------------------ *
 * M8 PortableProfile bundling                                         *
 * ------------------------------------------------------------------ */

export interface MemoryEntry {
  id: string;
  primitiveId: MemoryPrimitiveId;
  ownerId: string;
  payload: unknown;
  createdAt: number;
  /** ms-since-epoch when expiration applies, null = perpetual. */
  expiresAt: number | null;
}

export interface PortableProfile {
  ownerId: string;
  generatedAt: number;
  /** Map of primitive id -> entries that are portable. */
  entriesByPrimitive: Record<MemoryPrimitiveId, MemoryEntry[]>;
  /** Skipped entries with reason for transparency. */
  skipped: Array<{ id: string; primitiveId: MemoryPrimitiveId; reason: "non-portable" | "expired" }>;
}

export function buildPortableProfile(
  ownerId: string,
  entries: readonly MemoryEntry[],
  now: number = Date.now(),
): PortableProfile {
  const entriesByPrimitive = Object.fromEntries(
    ALL_PRIMITIVES.map((p) => [p, [] as MemoryEntry[]]),
  ) as Record<MemoryPrimitiveId, MemoryEntry[]>;
  const skipped: PortableProfile["skipped"] = [];
  for (const e of entries) {
    if (e.ownerId !== ownerId) continue;
    if (!MEMORY_PRIMITIVE_POLICY[e.primitiveId].portable) {
      skipped.push({ id: e.id, primitiveId: e.primitiveId, reason: "non-portable" });
      continue;
    }
    if (e.expiresAt !== null && e.expiresAt <= now) {
      skipped.push({ id: e.id, primitiveId: e.primitiveId, reason: "expired" });
      continue;
    }
    entriesByPrimitive[e.primitiveId].push(e);
  }
  return { ownerId, generatedAt: now, entriesByPrimitive, skipped };
}

/* ------------------------------------------------------------------ *
 * Right-to-forget                                                     *
 * ------------------------------------------------------------------ */

export interface ErasureRequest {
  ownerId: string;
  /** Subset of primitives to erase. */
  primitives: readonly MemoryPrimitiveId[];
  /** When set, only erase entries created at or before this ms-since-epoch. */
  beforeMs?: number;
}

export interface ErasurePlan {
  willErase: MemoryEntry[];
  willSkip: Array<{ entry: MemoryEntry; reason: "non-erasable" | "wrong-owner" | "out-of-scope" }>;
}

/**
 * Build the erasure plan without performing the erase. The caller
 * (a tRPC procedure) then writes a single audit record and applies
 * the deletes in a transaction.
 */
export function planErasure(
  request: ErasureRequest,
  entries: readonly MemoryEntry[],
): ErasurePlan {
  const requestedSet = new Set<MemoryPrimitiveId>(request.primitives);
  const willErase: MemoryEntry[] = [];
  const willSkip: ErasurePlan["willSkip"] = [];
  for (const e of entries) {
    if (e.ownerId !== request.ownerId) {
      willSkip.push({ entry: e, reason: "wrong-owner" });
      continue;
    }
    if (!requestedSet.has(e.primitiveId)) {
      willSkip.push({ entry: e, reason: "out-of-scope" });
      continue;
    }
    if (request.beforeMs !== undefined && e.createdAt > request.beforeMs) {
      willSkip.push({ entry: e, reason: "out-of-scope" });
      continue;
    }
    if (!MEMORY_PRIMITIVE_POLICY[e.primitiveId].erasable) {
      willSkip.push({ entry: e, reason: "non-erasable" });
      continue;
    }
    willErase.push(e);
  }
  return { willErase, willSkip };
}
