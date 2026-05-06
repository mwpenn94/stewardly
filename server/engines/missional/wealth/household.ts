/**
 * Wealth household graph — Intent handler for missional.wealth.household.graph
 *
 * Household graph nodes (advisor, client, spouse, dependents, beneficiaries,
 * trusted contacts) and edges (relationships, beneficiary designations,
 * powers of attorney) live in the Contextual engine; this handler exposes
 * the wealth-mission view over them.
 */

import type { EngineContext, Intent, IntentResult } from "../../_intent";
import { emptyCost } from "../../_intent";

export type HouseholdGraphOpKind =
  | "upsertHousehold"
  | "addMember"
  | "removeMember"
  | "addBeneficiary"
  | "addPowerOfAttorney"
  | "list"
  | "get";

export interface HouseholdGraphPayload {
  op: HouseholdGraphOpKind;
  householdId?: string;
  member?: {
    relationship: "client" | "spouse" | "dependent" | "beneficiary" | "trusted_contact";
    fullName: string;
    dateOfBirth?: string;
    contactInfo?: { email?: string; phone?: string };
  };
  beneficiary?: { contractId: string; memberId: string; share: number };
  powerOfAttorney?: { memberId: string; scope: "financial" | "healthcare" | "general"; effectiveDate?: string };
}

export async function householdGraphOp(
  ctx: EngineContext,
  intent: Intent<unknown>,
): Promise<IntentResult> {
  const payload = intent.payload as Partial<HouseholdGraphPayload>;
  if (!payload?.op) {
    return {
      ok: false,
      error: { code: "BAD_PAYLOAD", message: "missional.wealth.household.graph requires { op, ... }" },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }

  // The Contextual engine owns the actual graph. We dispatch via the
  // substrate router, which will route to the contextual engine through
  // chatRouter when the implementation is wired.
  const result = await ctx.substrate.dispatch({
    kind: "contextual.household.graph",
    expects: ["agentic-runtime"],
    payload,
    meta: { ...ctx.meta, originEngine: "missional" },
  });

  return result;
}
