/**
 * Wave C-1 — Stewardly five-layer hierarchy + delegate-scope primitive
 * ======================================================================
 *
 * Reconciliation C (locked by user, see PHASE1_BRIEF.md §D-N): the
 * structural identity model is a strict five-layer hierarchy plus an
 * orthogonal delegate-scope dimension that any principal at any layer
 * can use to grant a strictly-subset permission envelope to a delegate.
 * The assistant pattern is a `DelegateScope` of a Professional, not a
 * sixth layer.
 *
 * Five layers (most-permissive on the left, least-permissive on the right):
 *
 *   Tenant > Organization > Team > Professional > Client
 *
 * Per the existing schema, the canonical names are:
 *
 *   - Tenant       (a.k.a. "platform" / `global_admin`)
 *   - Organization (`org_admin` / `org_member`)
 *   - Team         ("manager" + members)
 *   - Professional ("professional")
 *   - Client       ("user")
 *
 * Cross-layer rules:
 *   - Tenant isolation is an outer guard: principals from tenant A
 *     never see tenant B even if they are at the same layer.
 *   - `requireLayerAtLeast(LayerId)` middleware checks numeric weight.
 *   - `requireSameTenant(...)` middleware enforces the outer isolation.
 *
 * Delegate scope:
 *   - A principal P at any layer may grant a delegate D a permission
 *     envelope E that is a STRICT SUBSET of P's own envelope.
 *   - `assertSubsetOfPrincipal(...)` middleware prevents escalation: a
 *     delegate cannot exceed the principal's own envelope.
 *   - Audit attribution attaches the principal's identity to every
 *     action the delegate performs, so the audit trail records both
 *     "who acted" (delegate) and "under whose authority" (principal).
 *
 * Five canonical delegate-scope patterns (covered by persona-smoke):
 *
 *   1. Professional   → Assistant
 *   2. Tenant admin   → Deputy
 *   3. Organization   → Deputy
 *   4. Team supervisor→ Acting supervisor
 *   5. Client         → Authorized representative
 *
 * This module is pure and has no DB dependency. It exposes typed
 * checkers used by tRPC procedures, engine handlers, and tests.
 */

export type LayerId = "Tenant" | "Organization" | "Team" | "Professional" | "Client";

/**
 * Numeric weight of each layer; higher = more permissive.
 * Used by `requireLayerAtLeast` to enforce monotone permissioning.
 */
export const LAYER_WEIGHT: Record<LayerId, number> = {
  Tenant: 5,
  Organization: 4,
  Team: 3,
  Professional: 2,
  Client: 1,
};

export const ALL_LAYERS: readonly LayerId[] = [
  "Tenant",
  "Organization",
  "Team",
  "Professional",
  "Client",
];

/**
 * A permission envelope is a set of named capabilities. The exact
 * capability vocabulary is engine-defined; this module only enforces
 * the structural rules (subset, intersection, etc.).
 */
export type PermissionEnvelope = ReadonlySet<string>;

/**
 * Construct an envelope from any iterable of capability strings.
 */
export function envelopeOf(caps: Iterable<string>): PermissionEnvelope {
  return new Set<string>(caps);
}

export class HierarchyViolation extends Error {
  readonly code: string;
  constructor(code: string, msg: string) {
    super(`Hierarchy ${code}: ${msg}`);
    this.name = "HierarchyViolation";
    this.code = code;
  }
}

export class DelegateEscalation extends Error {
  readonly code = "DELEGATE_ESCALATION";
  constructor(extras: string[]) {
    super(
      `DelegateScope escalation: delegate envelope contains capability not in principal's envelope: ${extras.join(", ")}`,
    );
    this.name = "DelegateEscalation";
  }
}

export class TenantIsolationViolation extends Error {
  readonly code = "TENANT_ISOLATION";
  constructor(actorTenant: string, targetTenant: string) {
    super(`Tenant isolation: actor.tenantId=${actorTenant} cannot reach target.tenantId=${targetTenant}`);
    this.name = "TenantIsolationViolation";
  }
}

/**
 * Throws HierarchyViolation if `actor` is below `required` layer.
 */
export function requireLayerAtLeast(actor: LayerId, required: LayerId): void {
  if (LAYER_WEIGHT[actor] < LAYER_WEIGHT[required]) {
    throw new HierarchyViolation(
      "INSUFFICIENT_LAYER",
      `actor=${actor} (${LAYER_WEIGHT[actor]}) is below required=${required} (${LAYER_WEIGHT[required]})`,
    );
  }
}

/**
 * Throws TenantIsolationViolation when actor and target tenant differ.
 */
export function requireSameTenant(actorTenant: string, targetTenant: string): void {
  if (actorTenant !== targetTenant) {
    throw new TenantIsolationViolation(actorTenant, targetTenant);
  }
}

/* ------------------------------------------------------------------ *
 * Delegate scope                                                      *
 * ------------------------------------------------------------------ */

export interface DelegateScope {
  /** Layer of the principal (e.g. "Professional"). */
  principalLayer: LayerId;
  /** Stable id of the principal (user id, org id, etc.). */
  principalId: string;
  /** Stable id of the delegate (a different actor). */
  delegateId: string;
  /** The capabilities granted to the delegate. */
  grantedEnvelope: PermissionEnvelope;
  /** ms-since-epoch when the grant becomes revocable; null = perpetual. */
  revocableAt: number | null;
}

/**
 * Throws DelegateEscalation when `granted` is not a strict subset of
 * `principal`. (Equality is allowed; set equality is the maximum a
 * delegate can ever receive.)
 */
export function assertSubsetOfPrincipal(
  principal: PermissionEnvelope,
  granted: PermissionEnvelope,
): void {
  const extras: string[] = [];
  for (const cap of granted) {
    if (!principal.has(cap)) extras.push(cap);
  }
  if (extras.length > 0) throw new DelegateEscalation(extras);
}

/**
 * Build an audit-attribution record that names both the acting
 * delegate and the authorizing principal. Returned by middleware so
 * the engine handler can stamp it onto IntentMeta.
 */
export interface AuthorityAttribution {
  /** Layer at which the action is being authorized. */
  layer: LayerId;
  /** The delegate who executed the action. */
  delegateId: string;
  /** The principal whose authority the delegate acted under. */
  principalId: string;
  /** The capabilities the delegate had to act under. */
  envelope: readonly string[];
}

export function buildAttribution(scope: DelegateScope): AuthorityAttribution {
  return {
    layer: scope.principalLayer,
    delegateId: scope.delegateId,
    principalId: scope.principalId,
    envelope: Array.from(scope.grantedEnvelope).sort(),
  };
}

/**
 * The five canonical delegate-scope patterns required to be supported
 * (per PHASE1_BRIEF.md §C-1 validation criterion).
 */
export type CanonicalPattern =
  | "professional-to-assistant"
  | "tenant-admin-to-deputy"
  | "organization-to-deputy"
  | "team-supervisor-to-acting-supervisor"
  | "client-to-authorized-representative";

export function patternToPrincipalLayer(p: CanonicalPattern): LayerId {
  switch (p) {
    case "professional-to-assistant": return "Professional";
    case "tenant-admin-to-deputy": return "Tenant";
    case "organization-to-deputy": return "Organization";
    case "team-supervisor-to-acting-supervisor": return "Team";
    case "client-to-authorized-representative": return "Client";
  }
}
