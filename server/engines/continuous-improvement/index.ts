/**
 * Continuous Improvement engine
 * =============================
 *
 * The platform's self-extending intelligence and efficiency capabilities.
 * Name retained from stewardly-ai (the only engine that did not get
 * renamed in v3 because the name was already correct).
 *
 * Responsibilities:
 *   - run recursive Pass cycles (the "Pass 162", "Pass 163" lineage)
 *   - propose substrate-cost optimizations to the practitioner
 *     at the configured admin level
 *   - coordinate with the BYOM single-button-press setup agent
 *   - self-apply: report platform commitment-coverage metrics (Wave B-4)
 *
 * Intent kinds:
 *   - continuous-improvement.pass.run
 *   - continuous-improvement.pass.report
 *   - continuous-improvement.byom.setup
 *   - continuous-improvement.byom.estimate
 *   - continuous-improvement.coverage.snapshot       (Wave B-4)
 *   - continuous-improvement.roundtrip.observe       (Wave B-6)
 *   - continuous-improvement.roundtrip.report        (Wave B-6)
 */

import type { EngineHandler, IntentResult } from "../_intent";
import { emptyCost } from "../_intent";
import {
  computePlatformCoverage,
  DEFAULT_OPERATIONAL_BASELINE,
  type PlatformCoverageReport,
} from "./coverage";
import {
  observeRoundTrip,
  getRoundTripReport,
  type RoundTripObservation,
  type RoundTripReport,
} from "./roundTrip";

export const continuousImprovementHandler: EngineHandler = async (ctx, intent): Promise<IntentResult> => {
  ctx.log("info", "continuous-improvement.received", { kind: intent.kind });

  switch (intent.kind) {
    case "continuous-improvement.pass.run":
    case "continuous-improvement.pass.report":
    case "continuous-improvement.byom.setup":
    case "continuous-improvement.byom.estimate":
      return ctx.substrate.dispatch(intent);

    case "continuous-improvement.coverage.snapshot": {
      // Self-application: CI reports its own coverage and the four other
      // engines' coverage as a first-class artifact. No sibling-engine
      // imports — only the public ontological enumeration in coverage.ts.
      const report: PlatformCoverageReport = computePlatformCoverage({
        operationalByEngine: DEFAULT_OPERATIONAL_BASELINE,
      });
      return {
        ok: true,
        data: report,
        invoked: [],
        cost: emptyCost(),
        auditId: ctx.meta.correlationId,
      };
    }

    case "continuous-improvement.roundtrip.observe": {
      // Wave B-6: TaskChat → Hub conversational-to-persistent round-trip
      // observation. Payload: { taskId, hubItemId, startedAt, completedAt,
      // success }. Returns the observation id.
      const payload = (intent as unknown as { payload?: RoundTripObservation }).payload;
      if (!payload || typeof payload !== "object") {
        return {
          ok: false,
          error: { code: "BAD_PAYLOAD", message: "roundtrip.observe requires a RoundTripObservation payload" },
          invoked: [],
          cost: emptyCost(),
          auditId: ctx.meta.correlationId,
        };
      }
      const id = observeRoundTrip(payload);
      return {
        ok: true,
        data: { observationId: id },
        invoked: [],
        cost: emptyCost(),
        auditId: ctx.meta.correlationId,
      };
    }

    case "continuous-improvement.roundtrip.report": {
      // Wave B-6: returns the rolling p50/p95 latency, success rate, and
      // sample count for the TaskChat → Hub round-trip.
      const report: RoundTripReport = getRoundTripReport();
      return {
        ok: true,
        data: report,
        invoked: [],
        cost: emptyCost(),
        auditId: ctx.meta.correlationId,
      };
    }

    default:
      return {
        ok: false,
        error: { code: "UNKNOWN_INTENT", message: `Continuous Improvement does not handle "${intent.kind}"` },
        invoked: [],
        cost: emptyCost(),
        auditId: ctx.meta.correlationId,
      };
  }
};
