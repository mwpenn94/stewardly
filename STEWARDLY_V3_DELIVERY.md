# Stewardly v3 — Build Delivery Report

**Repository:** https://github.com/mwpenn94/stewardly (public)
**Build branch:** `main`
**Latest commit:** `2e94acb` (Phase 5 — validation suite, deploy bundle, DNS cutover, archive PR)
**Status:** Phases 1–5 complete. Production migration scripts, deploy bundle, DNS cutover plan, and the legacy-repo archival PR are ready for operator execution.

---

## Phase rollup

The build proceeded straight through the v3 prompt's five phases. Each phase ended with a typecheck-clean push to `main` so any phase boundary can be re-cut as a release tag.

| Phase | Outcome | Key artifacts |
|-------|---------|---------------|
| 1 | Foundation rebranded as `stewardly` | `package.json` rename, root README replaced (original preserved at `docs/foundation/README.md`), `.env.example` covering foundation + integration secrets |
| 2 | Five-engine architecture wired to Intent contract; wealth mission ported | `server/engines/_intent.ts`, `server/engines/_substrate.ts`, `server/engines/_substrateAdapters.ts`, `server/engines/index.ts`, `server/engines/{formational,relational,missional,contextual,continuous-improvement}/`, `server/engines/missional/wealth/` (calculators, planning, advisor, household, ce, plus the ported `wealth-engines-legacy/` tree) |
| 3 | Additive SQL migration + Python migration toolkit + runbook | `drizzle/0048_exotic_snowbird.sql` (414 CREATE TABLE + 79 idempotent ALTERs, zero DROPs), 9 scripts under `migrations/scripts/`, `migrations/runbooks/PHASE_3_RUNBOOK.md`, `migrations/runbooks/validation-queries.sql` |
| 4 | 14 glass components integrated; clearly-appropriate rationale logged | `client/src/components/glass/` (5 top-level + 9 substrate + design-tokens.css preserved), `client/src/contexts/DisclosureContext.tsx`, `client/src/hooks/useNavBadges.ts`, `App.tsx` wrapped with `<DisclosureProvider>`, `docs/phase4/CLEARLY_APPROPRIATE_TEST.md` |
| 5 | Validation suite + deploy bundle + DNS plan + archive PR | `server/engines/__tests__/persona-smoke.test.ts` (5/5 personas green), `docs/phase5/VALIDATION_CHECKLIST.md`, `docs/phase5/PHASE_5_RUNBOOK.md`, `docs/phase5/dns/Caddyfile.legacy-redirect`, `docs/phase5/STEWARDLY_AI_ARCHIVE_PR.md` |

---

## Build verification at HEAD

The repo at `mwpenn94/stewardly @ main` was last verified locally with:

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npx tsc --noEmit` | exit 0 (zero errors across client, shared, server) |
| Engine tests | `npx vitest run server/engines/` | 9/9 passing in 751 ms |
| Persona smoke | `persona-smoke.test.ts` | 5/5 (Member-formational, Member-relational, Advisor-wealth, Manager-audit, Admin-CI) |
| Engines registered | `server/engines/index.ts` | All 5 engines route through the cross-engine `chatRouter` |
| Migration size | `drizzle/0048_exotic_snowbird.sql` | 7,108 lines, 414 CREATE TABLE, 79 ALTER calls, 0 DROPs |
| Glass components | `client/src/components/glass/` | 13 `.tsx` + design-tokens.css + README |

---

## What remains for the operator (Mike)

The v3 prompt specifies that some actions must be human-confirmed because they touch production data or are destructive. Those actions are scripted but not executed here.

The first remaining action is **applying the Phase 3 migration to production**. The full sequence is documented in `migrations/runbooks/PHASE_3_RUNBOOK.md`. It needs (a) a fresh `mysqldump --single-transaction` of the legacy `stewardly-ai` database, and (b) the production DSN plus the new vault and integration encryption keys exported as environment variables. The runbook defines a backup step, a dry-run step, the live migration via `migrations/scripts/run_all.sh`, and the validation queries that gate success. A failure at any step reverts to the backup taken in step 1.

The second remaining action is **building and pushing the Docker image and standing it up on a parallel hostname** (`v3.stewardly.app`). The existing multi-stage `Dockerfile` is already non-root, tini-wrapped, and produces a ~180 MB image. Once the parallel host is healthy, a TTL drop on the `stewardly.app` CNAME followed by the cutover and a metrics watch completes the traffic flip. The full cutover sequence with rollback (≤ 60 seconds) is in `docs/phase5/PHASE_5_RUNBOOK.md`.

The third remaining action is the **seven-day watch window**. The runbook defines the daily checks (persona smoke, error budget, support flag review, memory growth, long DB queries) and the rule that any single red day resets the seven-day clock.

The fourth remaining action is **archiving `mwpenn94/stewardly-ai`**. The PR draft is ready at `docs/phase5/STEWARDLY_AI_ARCHIVE_PR.md`. After the seven-day watch window completes cleanly, opening that PR, merging it, and clicking GitHub's "Archive this repository" button (one manual click) is the final destructive step.

---

## What was deferred and why

A small number of items were intentionally not executed in this build, each for a principled reason that maps back to v3 §7 (avoid silent risk to customer data) and §1.5 (asset-blocked work).

The `aiToolsRegistry` integration from `stewardly-ai` was stubbed rather than ported because the foundation's tool surface is undergoing churn and a full port would require API surface that has changed twice in the last 30 days. The stub is type-safe and returns a "deferred" proposal so callers do not crash. This is recorded in `docs/phase4/CLEARLY_APPROPRIATE_TEST.md` row 7.

The Gmail integration was stubbed for the same reason. The other four integrations (GHL, SnapTrade, Plaid, SMS-iT) are integrated and their credentials migrate via `migrations/scripts/11_migrate_integration_credentials.py`.

The `addendum-phaseN` test corpus from `stewardly-ai` was deferred. The persona-smoke suite gives a baseline for cutover; a selective port of the deeper test corpus is scoped for the next pass.

The actual click of the GitHub "Archive this repository" button is not automated. This is intentional and matches §7's rule that destructive production-shape actions remain a human's responsibility.

---

## Files of interest, in order

If you want to read just five files to evaluate the build, read them in this order:

1. `server/engines/index.ts` — the cross-engine `chatRouter` and the five-engine registry. Demonstrates the substrate boundary and the rule that engines do not import each other.
2. `migrations/runbooks/PHASE_3_RUNBOOK.md` — the live-migration runbook. Demonstrates the additive-only discipline (§6) and the safety sequence (backup → dry-run → live → validate → rollback).
3. `docs/phase4/CLEARLY_APPROPRIATE_TEST.md` — the rationale log for every stewardly-ai infrastructure candidate, applying the three-condition test from §4.3.
4. `docs/phase5/PHASE_5_RUNBOOK.md` — the cutover runbook with the DNS plan, the seven-day watch checks, and the archival sequence.
5. `docs/phase5/STEWARDLY_AI_ARCHIVE_PR.md` — the draft PR that retires `mwpenn94/stewardly-ai` and the explicit gate on Mike's manual archive click.

---

## How to pick this back up

Clone the repo, install deps, and run the verification:

```
gh repo clone mwpenn94/stewardly
cd stewardly
pnpm install --frozen-lockfile
pnpm run check
pnpm test server/engines/
```

To execute the production migration once you have the dump and the secrets, follow `migrations/runbooks/PHASE_3_RUNBOOK.md` end-to-end. To execute the production cutover after the migration, follow `docs/phase5/PHASE_5_RUNBOOK.md`.
