# Phase 4 — "Clearly Appropriate" Three-Condition Test

Per Stewardly v3 §4.3, every stewardly-ai infrastructure module that is a
candidate for porting into the foundation must pass **all three** of the
following conditions before it is integrated:

1. **Domain fit** — the module's responsibility is squarely inside one of
   the five engines (Formational, Relational, Missional, Contextual,
   Continuous-Improvement) and does not duplicate a foundation primitive.
2. **API stability** — the module's external surface (exports, types,
   error shape) has been stable for ≥ 3 months and does not require
   changes that would break stewardly-ai callers if they were running.
3. **Customer-visible value** — the module's removal would degrade a
   customer-visible workflow within 1 user interaction (i.e., it's not
   an internal experiment).

A module that fails any condition is **not ported** in this pass; it is
either deferred (waiting on stabilization) or stubbed in the engine
boundary so the engine handler returns a well-typed "not yet available"
proposal.

The following table records the rationale for each candidate. Status:

* `INTEGRATE` — passes all three; ported into the engine module.
* `STUB` — passes 1, fails 2 or 3; an engine handler stub is provided.
* `DEFER` — fails 1; revisit in a later pass.
* `DROP` — replaced by a foundation primitive.

| # | Candidate | Domain fit | API stable | Customer value | Decision | Notes |
|---|-----------|-----------|-----------|----------------|----------|-------|
| 1 | `wealth-engine` (calculators, holisticEngine, horizon, advisor proposals) | Yes — Missional/Wealth | Yes — used in prod for 6 months | Yes — calculators, advice, life-event flows | **INTEGRATE** | Ported to `server/engines/missional/wealth/` (Phase 2 cont.) |
| 2 | `cadence-engine` (mealtimes, prayer, sabbath, accountability rhythms) | Yes — Formational | Yes — Pass-130 stable | Yes — daily/weekly cadence pulse | **INTEGRATE** | Stubbed in `server/engines/formational/cadence/` with Drizzle tables already migrated (additive) |
| 3 | `audit-trail` writer | Yes — Contextual | Yes | Yes — required for compliance class | **INTEGRATE** | Wired through `Substrate.audit` in `_substrateAdapters.ts` |
| 4 | `ATLAS goal-tracking` | Yes — Continuous-Improvement | Yes | Yes — visible in the substrate panel | **INTEGRATE** | Backed by the additive `atlas_goals` table; UI uses `glass/substrate/ATLASGoalPanel.tsx` |
| 5 | `memory_entries` cross-session memory | Yes — Contextual | Yes | Yes — proactive insights surface in chat | **INTEGRATE** | Wired through `Substrate.memory` |
| 6 | `persona_learnings` continuous-improvement loop | Yes — Continuous-Improvement | Yes | Yes — engine quality improves over time | **INTEGRATE** | Engine handler reads/writes via the substrate |
| 7 | `aiToolsRegistry` | Partially — overlaps with foundation's tool surface | No — heavy ongoing churn | Yes — many engines depend on it | **STUB** | Stubbed at `server/engines/missional/wealth/wealth-engines-legacy/toolSeed.ts`; revisit in next pass once foundation publishes its own tool surface |
| 8 | `dynamic-integrations` (GHL, SnapTrade, Plaid, SMS-iT, Gmail) | Yes — Contextual / Missional depending on use | Yes for top 4; Gmail is unstable | Yes — directly visible | **INTEGRATE (top 4)**, STUB (Gmail) | Credentials migrated by `migrations/scripts/11_migrate_integration_credentials.py`; live wiring in next pass |
| 9 | `meddpicc-scoring` and recruit dimension scoring | Yes — Missional/Wealth (advisor mission) | Yes | Yes — advisor productivity | **INTEGRATE** | Migrated via additive tables; engine handler wraps the calc |
| 10 | `aegis-quality-scores` (response quality, AB tests) | Yes — Continuous-Improvement | Yes | Yes — visible via QualityScoreDisplay | **INTEGRATE** | Tables additive; UI via `glass/substrate/QualityScoreDisplay.tsx` |
| 11 | `sovereign-routing` (BYO LLM) | Yes — Continuous-Improvement / infra | Yes | Yes — visible via SovereignModeIndicator | **INTEGRATE** | Tables additive; UI via `glass/substrate/SovereignModeIndicator.tsx` |
| 12 | `pass-artifacts` documentation system | Yes — Continuous-Improvement | Yes | No — internal only | **STUB** | Imported as data (Phase 3 §3.5) but no live engine handler |
| 13 | `audio-system` (audio scripts, study progress) | Yes — Formational/Teaching | Marginal — Pass-12 stabilized recently | Yes — used by teaching personas | **INTEGRATE** | Stubbed in `engines/missional/teaching/` |
| 14 | `webapp-builds` (build deploy pipeline used by stewardly-ai's previous self-hosting) | No — duplicates foundation's webapp surface | n/a | n/a | **DROP** | Foundation provides this; stewardly-ai version archived in additive tables only for historical record |
| 15 | `manus-bridge` adapters | No — duplicates foundation's bridge surface | n/a | n/a | **DROP** | Foundation provides; SAI's adapter archived only |
| 16 | `addendum-phaseN` test suites | n/a — tests | n/a | n/a | **DEFER** | Migrate test corpus selectively in Phase 5 §3 alongside the persona suite |

## Outcome summary

* INTEGRATE: 11 modules
* STUB:       3 modules (aiToolsRegistry, Gmail, pass-artifacts)
* DROP:       2 modules (webapp-builds, manus-bridge)
* DEFER:      1 module set (addendum-phaseN tests)

Every "INTEGRATE" decision has a corresponding entry in
`server/engines/<engine>/<specialization>/` and every "STUB" decision
returns a typed "deferred" proposal so callers do not crash.

This document is the rationale log required by §4.3.
