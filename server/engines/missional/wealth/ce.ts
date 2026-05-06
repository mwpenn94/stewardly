/**
 * Wealth CE tracking — Intent handler for missional.wealth.ce.track
 *
 * Continuing education tracking for the advisor mission. CE is compliance
 * class — automatic admin level is forbidden (v3 §3 §7). The substrate
 * router refuses automatic, and we re-assert at the engine boundary.
 */

import type { EngineContext, Intent, IntentResult } from "../../_intent";
import { emptyCost, assertComplianceAdminAllowed } from "../../_intent";

export type CeOp = "log" | "list" | "summary" | "exportReport";

export interface CePayload {
  op: CeOp;
  course?: {
    title: string;
    provider: string;
    credits: number;
    completedAt: string;
    state?: string;
    licenseClass?: "life" | "health" | "p_c" | "series_6" | "series_7" | "series_63" | "series_65" | "series_66";
  };
  filter?: { from?: string; to?: string; licenseClass?: string };
  reportFormat?: "csv" | "pdf";
}

export async function trackCe(
  ctx: EngineContext,
  intent: Intent<unknown>,
): Promise<IntentResult> {
  // Compliance class — never automatic.
  assertComplianceAdminAllowed({ ...ctx.meta, originEngine: "missional", isComplianceClass: true });

  const payload = intent.payload as Partial<CePayload>;
  if (!payload?.op) {
    return {
      ok: false,
      error: { code: "BAD_PAYLOAD", message: "missional.wealth.ce.track requires { op, ... }" },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }

  // Delegate to the substrate; the contextual engine + document-intelligence
  // primitive together produce the report.
  return ctx.substrate.dispatch({
    kind: "contextual.ce.track",
    expects: ["agentic-runtime", "document-intelligence"],
    payload,
    meta: { ...ctx.meta, originEngine: "missional", isComplianceClass: true },
  });
}
