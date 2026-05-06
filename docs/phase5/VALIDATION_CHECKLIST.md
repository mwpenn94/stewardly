# Phase 5 — Pre-Cutover Validation Checklist

Every box must be checked before the DNS cutover (Phase 5 §4). The list
is sequenced so that the cheapest checks come first and the most
expensive (live-traffic mirroring) come last.

## Build integrity

- [ ] `pnpm install --frozen-lockfile` — no lockfile drift
- [ ] `pnpm run check` — TypeScript exits 0
- [ ] `pnpm run build` — vite + esbuild bundle succeeds; `dist/index.js` present
- [ ] `docker build -t stewardly:v3-rc1 .` — image builds clean
- [ ] Image size ≤ 250 MB
- [ ] Image runs as non-root (`USER manus` in Dockerfile)

## Test gates

- [ ] `pnpm test` — full vitest suite green
- [ ] `server/engines/__tests__/persona-smoke.test.ts` — 5/5 personas
- [ ] `server/engines/__tests__/intent.test.ts` — engine contract intact

## Migration dry-run

- [ ] `./migrations/scripts/run_all.sh sai-prod-dump.sql --dry-run`
  - [ ] additive_tables = 414
  - [ ] no `[fail]` lines
  - [ ] users dump-count parity
  - [ ] tasks dump-count parity
  - [ ] document_vault_blobs count parity

## Migration applied to staging

- [ ] DDL applied (`drizzle/0048_exotic_snowbird.sql`)
- [ ] customer-state script ran clean
- [ ] integration-credentials script ran clean
- [ ] document-vault tenant DEKs re-wrapped
- [ ] Pass-162 artifacts imported
- [ ] `migrations/runbooks/validation-queries.sql` all green

## Smoke tests against staging

- [ ] `/healthz` returns 200
- [ ] login flow works end-to-end
- [ ] new chat surfaces ChatGreeting + 4 engine cards
- [ ] AppsGridMenu opens and routes to all engines
- [ ] PersonaSidebar5 shows expected layers per role
- [ ] VoiceOrb cycles idle → listening → processing → speaking
- [ ] Wealth calculator returns a result for a typical advisor input
- [ ] Audit search returns recent entries
- [ ] CI metrics summary returns

## Deploy bundle

- [ ] Image pushed to `ghcr.io/mwpenn94/stewardly:v3-rc1`
- [ ] Deploy manifest committed at `docs/phase5/deploy/`
- [ ] DNS cutover runbook printed/shared with operators
- [ ] Rollback plan tested (revert CNAME, verify in ≤ 60s)

## Authorization

- [ ] Mike's go/no-go on Slack (`#stewardly-ops`)
- [ ] Maintenance window posted at status.stewardly.app
- [ ] On-call paged
