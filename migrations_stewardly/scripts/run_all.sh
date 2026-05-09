#!/usr/bin/env bash
# Phase 3 — orchestrate the full Stewardly v3 migration.
#
# Usage:
#   DATABASE_URL=mysql://... \
#   STEWARDLY_VAULT_MASTER_KEY=hex \
#   STEWARDLY_INTEGRATION_KEY=hex \
#   ./run_all.sh /path/to/sai-prod-dump.sql [--dry-run] [--re-encrypt-blobs]
#
# Steps:
#   0) Sanity check env vars and dump file
#   1) Apply additive schema migration (drizzle/0048_exotic_snowbird.sql)
#   2) Migrate customer state (overlap rows + 414 additive tables)
#   3) Migrate integration credentials
#   4) Migrate document vault tenant keys (and optionally re-encrypt blobs)
#   5) Import Pass-162 artifacts
#   6) Validate (row counts, foreign-key integrity, persona test run)
#
# Logs to migrations/dry-run/run-<timestamp>.log. The script will halt
# on first error.
set -euo pipefail

DUMP="${1:-}"
DRY_RUN_FLAG=""
RE_ENCRYPT_FLAG=""
shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN_FLAG="--dry-run" ;;
    --re-encrypt-blobs) RE_ENCRYPT_FLAG="--re-encrypt-blobs" ;;
    *) echo "Unknown flag: $1" >&2; exit 2 ;;
  esac
  shift
done

# Two supported input modes:
#   (A) Pass a path to an existing mysqldump file as $1
#   (B) Set SAI_DATABASE_URL=mysql://user:pass@host/dbname and we'll
#       dump it into migrations/dry-run/sai-dump-<ts>.sql automatically.
ROOT_PRE="$(cd "$(dirname "$0")/../.." && pwd)"
mkdir -p "$ROOT_PRE/migrations/dry-run"

if [[ -z "$DUMP" && -n "${SAI_DATABASE_URL:-}" ]]; then
  TS_PRE="$(date +%Y%m%d-%H%M%S)"
  DUMP="$ROOT_PRE/migrations/dry-run/sai-dump-$TS_PRE.sql"
  echo "[run_all] No dump path supplied; running mysqldump from SAI_DATABASE_URL into $DUMP"
  if ! command -v mysqldump >/dev/null 2>&1; then
    echo "ERROR: mysqldump not found on PATH; install mysql-client or pre-supply a dump path." >&2
    exit 2
  fi
  mysqldump --single-transaction --quick --routines --triggers \
    "$SAI_DATABASE_URL" > "$DUMP"
fi

[[ -z "$DUMP" ]] && { echo "Usage: run_all.sh <dump> [--dry-run] [--re-encrypt-blobs]\n   or: SAI_DATABASE_URL=mysql://... ./run_all.sh '' [--dry-run]" >&2; exit 2; }
[[ ! -f "$DUMP" ]] && { echo "Dump not found: $DUMP" >&2; exit 2; }

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TS="$(date +%Y%m%d-%H%M%S)"
LOG="$ROOT/migrations/dry-run/run-$TS.log"
mkdir -p "$ROOT/migrations/dry-run"

log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG"; }

log "=== Stewardly v3 migration orchestrator ==="
log "DUMP=$DUMP DRY_RUN=$DRY_RUN_FLAG RE_ENCRYPT=$RE_ENCRYPT_FLAG"

if [[ -z "${DATABASE_URL:-}" && -z "$DRY_RUN_FLAG" ]]; then
  log "ERROR: DATABASE_URL is required (or pass --dry-run)"
  exit 2
fi

cd "$ROOT"

log "(0) Schema check — verifying additive migrations are on disk"
for f in drizzle/_additive/0048_exotic_snowbird.sql \
         drizzle/_additive/0048b_foundation_tables.sql \
         drizzle/_additive/0049_v3_create_only.sql \
         drizzle/_additive/0050_v3_column_alters.sql; do
  test -f "$f" || { log "Missing $f"; exit 2; }
done

log "(1) Apply additive schema migrations (idempotent)"
if [[ -z "$DRY_RUN_FLAG" ]]; then
  for f in drizzle/_additive/0049_v3_create_only.sql drizzle/_additive/0050_v3_column_alters.sql; do
    log "     applying $f"
    mysql "$DATABASE_URL" < "$f" 2>&1 | tee -a "$LOG"
  done
else
  log "  [dry-run] would apply drizzle/_additive/0049_v3_create_only.sql + 0050_v3_column_alters.sql"
fi

log "(2) Migrate customer state"
python3 migrations/scripts/10_migrate_customer_state.py --dump "$DUMP" \
  ${DATABASE_URL:+--target-url "$DATABASE_URL"} $DRY_RUN_FLAG 2>&1 | tee -a "$LOG"

log "(3) Migrate integration credentials"
python3 migrations/scripts/11_migrate_integration_credentials.py --dump "$DUMP" \
  ${DATABASE_URL:+--target-url "$DATABASE_URL"} $DRY_RUN_FLAG \
  ${STEWARDLY_INTEGRATION_LEGACY_KEY:+--legacy-key "env:STEWARDLY_INTEGRATION_LEGACY_KEY"} \
  ${STEWARDLY_INTEGRATION_KEY:+--new-key "env:STEWARDLY_INTEGRATION_KEY"} 2>&1 | tee -a "$LOG"

log "(4) Migrate document vault"
python3 migrations/scripts/12_migrate_document_vault.py --dump "$DUMP" \
  ${DATABASE_URL:+--target-url "$DATABASE_URL"} $DRY_RUN_FLAG $RE_ENCRYPT_FLAG \
  --legacy-master-key "env:STEWARDLY_VAULT_LEGACY_MASTER_KEY" \
  --new-master-key "env:STEWARDLY_VAULT_MASTER_KEY" 2>&1 | tee -a "$LOG"

log "(5) Import Pass-162 artifacts"
python3 migrations/scripts/13_import_pass162_artifacts.py --dump "$DUMP" \
  ${DATABASE_URL:+--target-url "$DATABASE_URL"} $DRY_RUN_FLAG 2>&1 | tee -a "$LOG"

log "(6) Validation queries"
if [[ -z "$DRY_RUN_FLAG" ]]; then
  mysql "$DATABASE_URL" < migrations/runbooks/validation-queries.sql 2>&1 | tee -a "$LOG"
else
  log "  [dry-run] would run migrations/runbooks/validation-queries.sql"
fi

log "=== complete ==="
log "Log: $LOG"
