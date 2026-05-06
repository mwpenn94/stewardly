/**
 * Missional engine
 * ================
 *
 * The engine of stewarded agency producing effect outward. Mission
 * specializations live as siblings under this engine; wealth is one of
 * many. (Was "Wealth" in stewardly-ai; promoted to a generic Missional
 * engine in v3 with wealth as a specialization.)
 *
 * Intent kinds:
 *   - missional.<mission>.<verb> — e.g. missional.wealth.calculate,
 *                                  missional.pastoral.sermon-plan, etc.
 *
 * Dispatch is by the `meta.mission` field (preferred) or by parsing the
 * intent kind's second segment as a fallback.
 */

import type { EngineHandler, MissionId, IntentResult } from "../_intent";
import { emptyCost } from "../_intent";
import { wealthMissionHandler } from "./wealth";
import { pastoralMissionHandler } from "./pastoral";
import { teachingMissionHandler } from "./teaching";
import { healthcareMissionHandler } from "./healthcare";
import { coachingMissionHandler } from "./coaching";
import { communityMissionHandler } from "./community";

const handlers: Record<MissionId, EngineHandler> = {
  wealth: wealthMissionHandler,
  pastoral: pastoralMissionHandler,
  teaching: teachingMissionHandler,
  healthcare: healthcareMissionHandler,
  coaching: coachingMissionHandler,
  community: communityMissionHandler,
};

export const missionalHandler: EngineHandler = async (ctx, intent): Promise<IntentResult> => {
  ctx.log("info", "missional.received", { kind: intent.kind, mission: ctx.meta.mission });

  const segments = intent.kind.split(".");
  const candidate = (ctx.meta.mission ?? (segments[1] as MissionId | undefined)) as MissionId | undefined;

  if (!candidate || !(candidate in handlers)) {
    return {
      ok: false,
      error: {
        code: "UNKNOWN_MISSION",
        message: `Missional: unknown specialization "${candidate ?? "(none)"}". Supported: wealth, pastoral, teaching, healthcare, coaching, community.`,
      },
      invoked: [],
      cost: emptyCost(),
      auditId: ctx.meta.correlationId,
    };
  }

  return handlers[candidate](ctx, intent);
};
