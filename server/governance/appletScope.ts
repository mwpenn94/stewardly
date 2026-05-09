/**
 * Wave C-4 — uniform applet-instance scope middleware
 * =====================================================
 *
 * Commitment C-23: every engine applet (formational, relational,
 * missional, contextual, continuous-improvement) is required to expose
 * CRUD on its instances within layer constraints. Rather than making
 * each applet implement bespoke checks, this module provides one
 * middleware function `requireAppletScope` that all engine handlers
 * and tRPC procedures can use uniformly.
 *
 * The middleware verifies four things:
 *
 *   AS-1  Tenant isolation: actor.tenantId === target.tenantId
 *   AS-2  Layer authorization: actor's layer >= the layer required by
 *         the operation on the target applet instance
 *   AS-3  Delegate envelope (when the actor is a delegate): the
 *         operation's required capability is in the delegate's granted
 *         envelope, AND the principal's envelope contains it (no
 *         escalation)
 *   AS-4  Counsel gate (when the operation is gated by a counsel
 *         flag): gate is cleared
 *
 * Returns an `AppletScopeAttribution` that the engine handler can
 * stamp onto IntentMeta for audit. If any check fails, the
 * appropriate typed error is thrown.
 *
 * The set of required-capability strings is engine-defined; this
 * module only provides the structural enforcement.
 */

import {
  type LayerId,
  type DelegateScope,
  type AuthorityAttribution,
  requireLayerAtLeast,
  requireSameTenant,
  assertSubsetOfPrincipal,
  buildAttribution,
  envelopeOf,
} from "./hierarchy";
import {
  type CounselGateRecord,
  requireGateCleared,
} from "./counselGates";

/**
 * Operation requirement: what the engine needs from the actor to
 * perform a given CRUD action on a given applet instance.
 */
export interface AppletScopeRequirement {
  /** Minimum actor layer required. */
  requiredLayer: LayerId;
  /** Capability string the actor must carry, if any. */
  requiredCapability?: string;
  /** Counsel gate that must be cleared, if any. */
  requiredCounselGate?: CounselGateRecord;
}

export interface AppletScopeActor {
  layer: LayerId;
  tenantId: string;
  /** When acting as a delegate, the scope under which the delegate is acting. */
  delegateScope?: DelegateScope;
  /** Capabilities the actor (or delegate) carries directly. */
  envelope: ReadonlySet<string>;
}

export interface AppletScopeTarget {
  /** Tenant the applet instance belongs to. */
  tenantId: string;
}

export interface AppletScopeAttribution extends AuthorityAttribution {
  /** Whether the actor was authorized as a delegate. */
  asDelegate: boolean;
}

/**
 * Verify all four conditions and return audit attribution. Throws on
 * any failure.
 */
export function requireAppletScope(
  actor: AppletScopeActor,
  target: AppletScopeTarget,
  req: AppletScopeRequirement,
): AppletScopeAttribution {
  // AS-1
  requireSameTenant(actor.tenantId, target.tenantId);
  // AS-2
  requireLayerAtLeast(actor.layer, req.requiredLayer);
  // AS-3
  if (req.requiredCapability !== undefined) {
    if (!actor.envelope.has(req.requiredCapability)) {
      throw new Error(
        `AppletScope: actor envelope missing required capability "${req.requiredCapability}"`,
      );
    }
    if (actor.delegateScope) {
      // Delegate must have the capability AND the principal must too
      // (the delegate scope was already validated at grant time, but we
      // re-verify here to remain defense-in-depth).
      if (!actor.delegateScope.grantedEnvelope.has(req.requiredCapability)) {
        throw new Error(
          `AppletScope: delegate's grantedEnvelope missing capability "${req.requiredCapability}"`,
        );
      }
      // Build a single-cap envelope and assert subset of the principal.
      assertSubsetOfPrincipal(actor.envelope, envelopeOf([req.requiredCapability]));
    }
  }
  // AS-4
  if (req.requiredCounselGate) {
    requireGateCleared(req.requiredCounselGate);
  }

  // Build attribution. When the actor is acting directly (not as
  // delegate), principalId === delegateId.
  if (actor.delegateScope) {
    const att = buildAttribution(actor.delegateScope);
    return { ...att, asDelegate: true };
  }
  return {
    layer: actor.layer,
    delegateId: "self",
    principalId: "self",
    envelope: Array.from(actor.envelope).sort(),
    asDelegate: false,
  };
}
