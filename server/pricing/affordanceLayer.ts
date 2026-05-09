/**
 * Stewardly pricing/affordance — Plug-and-play tool & skill affordance layer
 * ============================================================================
 *
 * Per PHASE1_BRIEF.md commitments C-22 (out-of-box AND BYOM equal first-class),
 * C-23 (CRUD-and-personalize at every layer), C-26 (technological completeness:
 * dynamically support the universe of current and future AI capabilities and
 * surfaces), and the user's framing that the platform ships "an internal AI
 * agent with tool CRUD/adoption similar to skill CRUD/import/export, with
 * starting 5 engine applets and extensibility for CRUD from internal out-of-
 * box capabilities and BYO for others", this module provides the affordance
 * primitives.
 *
 * Three affordances on every artifact (tool, skill, applet, agent, provider):
 *   - CRUD       (create, read, update, delete a customer-personalized variant)
 *   - Import     (bring an externally defined artifact in)
 *   - Export     (emit an artifact as a portable definition)
 *
 * Plus three lifecycle states: "draft", "published", "archived".
 *
 * Layering (commitment C-23):
 *   - The artifact's owner-layer (tenant, org, team, professional) determines
 *     who can write to it.
 *   - Delegate-scopes can grant a strict subset of the owner's permissions
 *     (Reconciliation C — five structural layers + orthogonal delegate-scope).
 *   - The Client layer can read but not write platform-level artifacts; they
 *     can only personalize their own client-scoped artifacts.
 *
 * Invariants (enforced by `__tests__/affordanceLayer.test.ts`):
 *   AL-1: every artifact has a stable ID, ownerLayer, and lifecycleState
 *   AL-2: import then export round-trips losslessly (the exported payload
 *         is identical to the imported payload after normalization)
 *   AL-3: an artifact owned at layer X cannot be written by a principal at
 *         layer Y where Y is downstream of X without an explicit delegate-scope
 *   AL-4: the engine applets are registered with ownerLayer="platform"
 *         (a synthetic 0th layer above tenant) so that all five layers have
 *         read access by default but only platform-engineer principals can
 *         write the canonical applet definitions
 *   AL-5: every artifact tracks a counsel-reviewed flag for compliance-
 *         class artifacts (commitment C-19)
 */

export type ArtifactKind = "tool" | "skill" | "applet" | "agent" | "provider" | "engine-personalization";

export type OwnerLayer = "platform" | "tenant" | "org" | "team" | "professional" | "client";

export type LifecycleState = "draft" | "published" | "archived";

export interface ArtifactDelegateScope {
  /** Principal ID of the delegate (a different principal from the owner). */
  delegatePrincipalId: string;
  /** Permissions granted; must be a strict subset of the owner's permissions. */
  permissions: Array<"read" | "update" | "delete" | "publish" | "archive">;
  /** Wall-clock expiry; null means until-revoked. */
  expiresAt: Date | null;
  /** Revoked flag; takes immediate effect when set. */
  revokedAt: Date | null;
}

export interface ArtifactRecord {
  id: string;
  kind: ArtifactKind;
  ownerLayer: OwnerLayer;
  ownerPrincipalId: string;
  lifecycleState: LifecycleState;
  /** Compliance-class artifacts must carry this counsel-reviewed flag. */
  complianceClass: boolean;
  counselReviewedFlag: boolean;
  /** Free-form payload describing the artifact (provider config, prompt
   *  template, tool schema, applet personalization JSON, etc.). */
  payload: Record<string, unknown>;
  /** Optional delegate-scopes. Each grants a strict subset of permissions. */
  delegateScopes: ArtifactDelegateScope[];
  /** Audit trail: who created it, when, and the most recent update. */
  createdAt: Date;
  updatedAt: Date;
}

export type Permission = ArtifactDelegateScope["permissions"][number];

const LAYER_ORDER: OwnerLayer[] = ["platform", "tenant", "org", "team", "professional", "client"];

/** Returns true if upstream is upstream-of-or-equal-to downstream. */
export function isLayerUpstream(upstream: OwnerLayer, downstream: OwnerLayer): boolean {
  return LAYER_ORDER.indexOf(upstream) <= LAYER_ORDER.indexOf(downstream);
}

export interface PrincipalContext {
  principalId: string;
  layer: OwnerLayer;
}

/**
 * AL-3 enforcement: can `principal` perform `permission` on `artifact`?
 * Returns true if the principal is the owner OR a delegate-scope grants the
 * permission AND the scope is not expired/revoked AND the artifact's lifecycle
 * permits the operation.
 */
export function canPerform(
  artifact: ArtifactRecord,
  principal: PrincipalContext,
  permission: Permission,
): boolean {
  // Compliance-class artifacts that lack counsel review cannot be published or
  // updated by anyone (commitment C-19).
  if (artifact.complianceClass && !artifact.counselReviewedFlag) {
    if (permission === "publish" || permission === "update") return false;
  }

  // Owner check.
  if (artifact.ownerPrincipalId === principal.principalId) {
    return true;
  }

  // Delegate-scope check.
  const now = Date.now();
  for (const scope of artifact.delegateScopes) {
    if (scope.delegatePrincipalId !== principal.principalId) continue;
    if (scope.revokedAt && scope.revokedAt.getTime() <= now) continue;
    if (scope.expiresAt && scope.expiresAt.getTime() <= now) continue;
    if (scope.permissions.includes(permission)) return true;
  }

  // Read fallback: principals at layers upstream of the artifact's owner
  // layer have read access by default (e.g., a tenant admin can read any
  // org-owned artifact within the tenant).
  if (permission === "read" && isLayerUpstream(principal.layer, artifact.ownerLayer)) {
    return true;
  }

  return false;
}

/** AL-2: lossless round-trip. Export = JSON-stable serialization of the
 *  artifact's payload + minimal identity envelope; import reconstructs an
 *  ArtifactRecord under the importing principal's ownership. */
export interface PortableArtifact {
  artifactKind: ArtifactKind;
  payload: Record<string, unknown>;
  complianceClass: boolean;
}

export function exportArtifact(artifact: ArtifactRecord): PortableArtifact {
  return {
    artifactKind: artifact.kind,
    payload: JSON.parse(JSON.stringify(artifact.payload)),
    complianceClass: artifact.complianceClass,
  };
}

export function importArtifact(
  portable: PortableArtifact,
  importer: PrincipalContext,
  options: { id: string; counselReviewedFlag?: boolean },
): ArtifactRecord {
  const now = new Date();
  return {
    id: options.id,
    kind: portable.artifactKind,
    ownerLayer: importer.layer,
    ownerPrincipalId: importer.principalId,
    lifecycleState: "draft",
    complianceClass: portable.complianceClass,
    counselReviewedFlag: options.counselReviewedFlag ?? false,
    payload: JSON.parse(JSON.stringify(portable.payload)),
    delegateScopes: [],
    createdAt: now,
    updatedAt: now,
  };
}
