# Phase 5 — Production Deploy, DNS Cutover, and Archival Runbook

This is the canonical operator runbook for cutting `stewardly.app` over
to the v3 build and archiving the legacy `stewardly-ai` codebase. It is
sequenced so that a failure at any step is non-destructive and reversible
within ≤ 60 seconds.

---

## 0. Pre-flight gates

All four gates must be green before starting. If any is red, **stop**.

| Gate | Owner | Pass criteria |
|------|-------|---------------|
| `pnpm check` (typecheck) | CI | exit 0 |
| `pnpm test` (vitest) | CI | all green, including `persona-smoke.test.ts` |
| Phase 3 dry-run on staging | Ops | `migrations/dry-run/run-*.log` shows zero `[fail]` lines |
| Backup of v3 prod DB | Ops | dump file present, ≥ 90% the size of yesterday's |

---

## 1. Build the deploy bundle

```bash
cd /home/ubuntu/work/stewardly
pnpm install --frozen-lockfile
pnpm run build           # vite build + esbuild server bundle
docker build -t ghcr.io/mwpenn94/stewardly:v3-rc1 .
```

The Dockerfile is multi-stage and produces a non-root, ~180 MB final
image with a tini PID-1 wrapper and a `/healthz` healthcheck on port
3000.

```bash
docker push ghcr.io/mwpenn94/stewardly:v3-rc1
```

---

## 2. Apply Phase 3 against production

Following the Phase 3 runbook (`migrations/runbooks/PHASE_3_RUNBOOK.md`):

```bash
cd /home/ubuntu/work/stewardly
export DATABASE_URL='mysql://stewardly:***@db.stewardly.app:3306/stewardly'
export STEWARDLY_VAULT_MASTER_KEY='...'
export STEWARDLY_VAULT_LEGACY_MASTER_KEY='...'
export STEWARDLY_INTEGRATION_KEY='...'
export STEWARDLY_INTEGRATION_LEGACY_KEY='...'

# 1) Take the safety backup
mysqldump --single-transaction --routines --triggers --quick \
  $DATABASE_URL | gzip > /home/mike/stewardly-v3-pre-cutover.sql.gz

# 2) Dry-run
./migrations/scripts/run_all.sh /home/mike/sai-prod-dump.sql --dry-run

# 3) Live migration
./migrations/scripts/run_all.sh /home/mike/sai-prod-dump.sql
```

Confirm `migrations/runbooks/validation-queries.sql` passes against
production before proceeding.

---

## 3. Deploy v3 to a parallel hostname

Stand up the new image at `v3.stewardly.app` (or whatever the
green/blue infra provides). Verify:

```bash
curl -fsS https://v3.stewardly.app/healthz   # 200 OK
curl -fsS https://v3.stewardly.app/api/version | jq
```

Run the persona smoke from outside the cluster:

```bash
pnpm test server/engines/__tests__/persona-smoke.test.ts \
  -- --reporter=tap > /tmp/v3-persona.tap
```

All 5 personas should pass.

---

## 4. DNS cutover

`stewardly.app` should currently CNAME → the legacy `stewardly-ai`
hostname. The cutover plan:

| Step | DNS record | Old value | New value | TTL |
|------|-----------|-----------|-----------|-----|
| 4.1 (T-1h) | `stewardly.app` TTL | n/a | lower TTL to 60s | 60s |
| 4.2 (T-0)  | `stewardly.app` CNAME | `legacy-stewardly.fly.dev` | `v3.stewardly.app` | 60s |
| 4.3 (T+5m) | confirm propagation | n/a | `dig stewardly.app` should return v3 | n/a |
| 4.4 (T+15m)| watch app metrics | n/a | error rate < 0.5% over 15m | n/a |

Rollback (≤ 60s): revert the CNAME in 4.2; client TTL is 60s, so worst
case clients converge in ≤ 60s.

The `legacy-stewardly.fly.dev` host stays up for the 7-day watch window.

---

## 5. The seven-day watch window

For 7 days post-cutover, run the following daily:

| Check | Command | Bar |
|-------|---------|-----|
| Persona smoke | `pnpm test server/engines/__tests__/persona-smoke.test.ts` | 5/5 pass |
| Error budget | check Datadog dashboard `stewardly-v3-errors` | < 0.5% |
| Customer support flag | review Linear board `stewardly-v3-issues` | 0 critical |
| Memory growth | Prom query `process_resident_memory_bytes` | < 1.5 GB / pod |
| DB long queries | `SELECT * FROM information_schema.processlist WHERE TIME > 5;` | 0 rows |

Any red on a single day **resets** the 7-day clock.

---

## 6. Archival of `mwpenn94/stewardly-ai`

Once the 7-day watch is green:

1. Open the prepared PR at `mwpenn94/stewardly-ai#archive-v3-cutover`
   (see `docs/phase5/STEWARDLY_AI_ARCHIVE_PR.md`). It:
   - Marks the repo `archived: true` in `.github/repo-config.yml`
   - Adds an `ARCHIVED.md` at the root pointing to `mwpenn94/stewardly`
   - Tags `v-final-pre-archival` at the current `main`
   - Updates the README to a one-line redirect
2. Merge the PR.
3. In GitHub Settings → General → Archive this repository, click
   "Archive". This is the only manual step.

Step 3 is the single destructive action and is gated by Mike's manual
click.
