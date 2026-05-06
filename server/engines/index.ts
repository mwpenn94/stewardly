/**
 * Stewardly engines — public registry
 * ====================================
 *
 * The five engines (Formational, Relational, Missional, Contextual,
 * Continuous Improvement) are registered here. Engines never import other
 * engines directly. The `chatRouter` exported below is the only legal
 * cross-engine path; it routes by intent kind.
 *
 * STEWARDLY v3 §3:
 *   - "engines never import other engines"
 *   - "cross-engine queries route through chat-router"
 *   - "substrate has zero engine-specific code"
 */

import type { EngineHandler, EngineId, Intent, IntentResult } from "./_intent";
import { makeSubstrateRouter, defaultStewardship } from "./_substrateAdapters";
import { formationalHandler } from "./formational";
import { relationalHandler } from "./relational";
import { missionalHandler } from "./missional";
import { contextualHandler } from "./contextual";
import { continuousImprovementHandler } from "./continuous-improvement";

export const engines: Record<EngineId, EngineHandler> = {
  formational: formationalHandler,
  relational: relationalHandler,
  missional: missionalHandler,
  contextual: contextualHandler,
  "continuous-improvement": continuousImprovementHandler,
};

/**
 * Cross-engine dispatch. Determines the owning engine from the intent kind
 * (kinds are dotted: "missional.wealth.calculate", "formational.curate", ...)
 * and runs the matching handler with a fresh EngineContext.
 */
export async function chatRouter<TPayload>(
  intent: Intent<TPayload>,
): Promise<IntentResult<unknown>> {
  const engineId = intent.kind.split(".")[0] as EngineId;
  const handler = engines[engineId];
  if (!handler) {
    throw new Error(`Stewardly: no engine registered for intent kind "${intent.kind}"`);
  }

  const substrate = makeSubstrateRouter();
  return handler(
    {
      engineId,
      meta: {
        tenantId: intent.meta.tenantId,
        practitionerId: intent.meta.practitionerId,
        mission: intent.meta.mission,
        adminLevel: intent.meta.adminLevel,
        correlationId: intent.meta.correlationId,
        isComplianceClass: intent.meta.isComplianceClass,
      },
      substrate,
      stewardship: defaultStewardship,
      log: (level, message, fields) => {
        // eslint-disable-next-line no-console
        console[level === "debug" ? "log" : level](`[${engineId}] ${message}`, fields ?? {});
      },
    },
    intent,
  );
}

export { defaultStewardship } from "./_substrateAdapters";
export type { EngineHandler, EngineId, Intent, IntentResult } from "./_intent";
