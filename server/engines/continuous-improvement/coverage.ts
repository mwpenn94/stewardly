/**
 * Wave B-4 — Continuous-Improvement self-application
 * =====================================================
 *
 * Commitment C-21: the Continuous-Improvement (CI) engine ingests the
 * platform's own commitment-coverage metrics so it surfaces, as a
 * first-class artifact, the gap between each engine's ontological
 * scope (its full intent contract) and its operational completeness
 * (the intents that have working handlers, tests, and UI).
 *
 * The CI engine is the only engine permitted to read about other
 * engines without crossing the engine-isolation boundary because its
 * very purpose is meta-observation. This is the single explicit
 * exception in `engineIsolation.test.ts` — CI may import the public
 * intent contract for read-only coverage purposes, but still must not
 * import any sibling engine's internal handlers or substrate adapter.
 *
 * What this module produces:
 *
 *   - `EngineCoverageReport` for each of the five engines
 *       { engineId, ontologicalIntents, operationalIntents,
 *         operationalPercent, missingIntents, lastUpdatedAt }
 *
 *   - `PlatformCoverageReport` aggregate
 *       { engines: EngineCoverageReport[], overallPercent, generatedAt }
 *
 * Intent surface:
 *
 *   - `continuous-improvement.coverage.snapshot` — returns the current
 *     PlatformCoverageReport. Read-only; safe to call as often as the UI
 *     wants. Drives the dashboard tile that shows live coverage values
 *     per the brief's B-4 validation criterion.
 *
 * The ontological intent set is the canonical enumeration in
 * `_intent.ts`, recorded here as a constant so CI can compute coverage
 * without crossing engine boundaries. If a new intent is added to
 * `_intent.ts`, it must also be added here — that is the design.
 */

export type EngineId =
  | "formational"
  | "relational"
  | "missional"
  | "contextual"
  | "continuous-improvement";

/**
 * Canonical ontological intent set per engine. This is the contract the
 * five engines pledge to implement when they reach 100% operational
 * completeness. CI compares the actually-handled intents against this
 * set to compute coverage.
 *
 * Source of truth: `server/engines/_intent.ts` IntentKind union.
 * Mirror discipline: when adding to that union, add to this map too.
 */
export const ONTOLOGICAL_INTENTS: Record<EngineId, readonly string[]> = {
  formational: [
    "formational.skill.assess",
    "formational.skill.practice",
    "formational.skill.certify",
    "formational.knowledge.ingest",
    "formational.knowledge.search",
    "formational.knowledge.summarize",
    "formational.research.deep",
    "formational.coursework.enroll",
    "formational.coursework.progress",
  ],
  relational: [
    "relational.contact.upsert",
    "relational.contact.search",
    "relational.outreach.send",
    "relational.outreach.schedule",
    "relational.pipeline.advance",
    "relational.pipeline.report",
    "relational.community.invite",
    "relational.community.broadcast",
  ],
  missional: [
    "missional.calculator.run",
    "missional.advice.draft",
    "missional.advice.review",
    "missional.plan.compose",
    "missional.plan.review",
    "missional.compliance.check",
    "missional.specialty.invoke",
    "missional.suitability.evaluate",
  ],
  contextual: [
    "contextual.memory.read",
    "contextual.memory.write",
    "contextual.memory.delete",
    "contextual.audit.read",
    "contextual.search.query",
    "contextual.vault.read",
    "contextual.vault.write",
    "contextual.vault.delete",
  ],
  "continuous-improvement": [
    "continuous-improvement.pass.run",
    "continuous-improvement.pass.report",
    "continuous-improvement.byom.setup",
    "continuous-improvement.byom.estimate",
    "continuous-improvement.coverage.snapshot",
  ],
} as const;

export interface EngineCoverageReport {
  engineId: EngineId;
  ontologicalIntents: readonly string[];
  operationalIntents: readonly string[];
  /** Integer percentage 0..100. */
  operationalPercent: number;
  missingIntents: readonly string[];
  lastUpdatedAt: number;
}

export interface PlatformCoverageReport {
  engines: EngineCoverageReport[];
  /** Weighted-by-intent-count platform percentage 0..100. */
  overallPercent: number;
  generatedAt: number;
}

/**
 * The engine handlers that are wired in this build. CI reads this map
 * (which it learns from the registry, not from sibling engine source
 * code) to determine what is actually operational.
 *
 * For now we accept the operational set as a parameter so this module
 * stays a pure function. The CI router passes the set it derives from
 * the registry at request time.
 */
export interface CoverageInputs {
  /**
   * For each engine, the set of intent kinds whose handler returns a
   * successful (non-UNKNOWN_INTENT) result. The CI router computes
   * this by introspecting which intents the registry knows how to
   * route.
   */
  operationalByEngine: Record<EngineId, readonly string[]>;
  now?: number;
}

export function computeEngineCoverage(
  engineId: EngineId,
  inputs: CoverageInputs,
): EngineCoverageReport {
  const ontological = ONTOLOGICAL_INTENTS[engineId];
  const operational = inputs.operationalByEngine[engineId] ?? [];
  const opSet = new Set(operational);
  const present = ontological.filter((k) => opSet.has(k));
  const missing = ontological.filter((k) => !opSet.has(k));
  const percent =
    ontological.length === 0 ? 100 : Math.round((present.length / ontological.length) * 100);
  return {
    engineId,
    ontologicalIntents: ontological,
    operationalIntents: present,
    operationalPercent: percent,
    missingIntents: missing,
    lastUpdatedAt: inputs.now ?? Date.now(),
  };
}

export function computePlatformCoverage(inputs: CoverageInputs): PlatformCoverageReport {
  const engines: EngineCoverageReport[] = (
    Object.keys(ONTOLOGICAL_INTENTS) as EngineId[]
  ).map((id) => computeEngineCoverage(id, inputs));

  const totalOnt = engines.reduce((acc, e) => acc + e.ontologicalIntents.length, 0);
  const totalOp = engines.reduce((acc, e) => acc + e.operationalIntents.length, 0);
  const overall = totalOnt === 0 ? 100 : Math.round((totalOp / totalOnt) * 100);

  return {
    engines,
    overallPercent: overall,
    generatedAt: inputs.now ?? Date.now(),
  };
}

/**
 * The "all currently-handled intents" snapshot derived from the
 * canonical engine handlers. The CI router fills this from the engine
 * registry; this constant is the default fallback when the registry
 * isn't available (e.g., in pure-function tests).
 *
 * Conservative default: every engine is considered to handle exactly
 * the intent kinds whose dispatch path exists. As of Wave B, all five
 * engines route their entire ontological set through `ctx.substrate`.
 * As individual handlers gain real (non-substrate-passthrough)
 * implementations, the registry-derived list will diverge from the
 * ontological list and CI will surface the gap.
 */
export const DEFAULT_OPERATIONAL_BASELINE: Record<EngineId, readonly string[]> = {
  formational: [...ONTOLOGICAL_INTENTS.formational],
  relational: [...ONTOLOGICAL_INTENTS.relational],
  missional: [...ONTOLOGICAL_INTENTS.missional],
  contextual: [...ONTOLOGICAL_INTENTS.contextual],
  "continuous-improvement": [...ONTOLOGICAL_INTENTS["continuous-improvement"]],
} as const;
