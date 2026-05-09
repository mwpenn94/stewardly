# Phase 3 Runbook — Customer-State, Integration, Vault, and Pass-162 Migration

This runbook walks an operator through migrating live `stewardly-ai`
customer state into the Stewardly v3 database. It is the **only**
acceptable path; do not run any of the constituent scripts in isolation.

The runbook follows the strict ordering required by the Stewardly v3
build prompt §1.3 (live-customer continuity) and §6 (additive schema only,
preserve everything).

---

## 0. Pre-flight

| Item | Required | Notes |
|------|----------|-------|
| MySQL 8.0+ on Stewardly v3 (target) | ✅ | Tested with 8.0.33 |
| `mysql` CLI installed | ✅ | Used by `run_all.sh` |
| Python 3.11 + `pymysql`, `cryptography` | ✅ | `pip install pymysql cryptography` |
| `stewardly-ai` mysqldump (full, single-transaction) | ✅ | Created with `mysqldump --single-transaction --routines --triggers --quick` |
| Env: `DATABASE_URL` | ✅ | DSN to v3 MySQL (e.g., `mysql://stewardly:***@db.stewardly.app:3306/stewardly`) |
| Env: `STEWARDLY_VAULT_MASTER_KEY` | ✅ | New tenant-vault master key (hex-encoded 32 bytes) |
| Env: `STEWARDLY_VAULT_LEGACY_MASTER_KEY` | ✅ | Legacy stewardly-ai vault master key |
| Env: `STEWARDLY_INTEGRATION_KEY` | ✅ | New integration-credential encryption key |
| Env: `STEWARDLY_INTEGRATION_LEGACY_KEY` | ✅ | Legacy integration key |

```bash
export DATABASE_URL='mysql://stewardly:...@db.stewardly.app:3306/stewardly'
export STEWARDLY_VAULT_MASTER_KEY='...'
export STEWARDLY_VAULT_LEGACY_MASTER_KEY='...'
export STEWARDLY_INTEGRATION_KEY='...'
export STEWARDLY_INTEGRATION_LEGACY_KEY='...'
```

The dump should be reachable at a path on the operator's machine, e.g.
`/home/mike/stewardly-ai-prod-2026-05-06.sql`.

---

## 1. Backup target

Before any write, take a full backup of the v3 database:

```bash
mysqldump --single-transaction --routines --triggers --quick \
  $DATABASE_URL > /home/mike/stewardly-v3-pre-migration.sql.gz
```

If the migration fails irrecoverably, restore via:

```bash
mysql $DATABASE_URL < /home/mike/stewardly-v3-pre-migration.sql.gz
```

---

## 2. Dry run

Always run a dry-run first. This parses the dump, validates schema parity,
and reports per-table row counts without writing anything.

```bash
cd /home/ubuntu/work/stewardly
./migrations/scripts/run_all.sh /home/mike/stewardly-ai-prod-2026-05-06.sql --dry-run
```

Inspect `migrations/dry-run/run-<timestamp>.log`. Look for:

* `additive_tables=414` — the additive set is recognized
* No `[fail]` lines — every table parsed cleanly
* `users: N rows (OVERLAP)` — N matches the prod row count
* `document_vault_blobs: N rows (ADDITIVE)` — vault blobs are present

If anything is amiss, **stop here**.

---

## 3. Live migration

### 3.1 Apply additive schema (DDL)

Idempotent; safe to re-run.

```bash
mysql $DATABASE_URL < drizzle/0048_exotic_snowbird.sql
```

This adds **414 new tables** plus **79 ALTER TABLE ADD COLUMN** calls
(wrapped in an idempotent stored-procedure helper) onto the 3 overlap
tables. It performs **zero DROPs**.

### 3.2 Migrate customer state

Inserts and updates run inside per-table transactions. Foreign-key
checks are deferred during load and re-validated at the end.

```bash
python3 migrations/scripts/10_migrate_customer_state.py \
  --dump /home/mike/stewardly-ai-prod-2026-05-06.sql \
  --target-url $DATABASE_URL
```

### 3.3 Migrate integration credentials

```bash
python3 migrations/scripts/11_migrate_integration_credentials.py \
  --dump /home/mike/stewardly-ai-prod-2026-05-06.sql \
  --target-url $DATABASE_URL \
  --legacy-key env:STEWARDLY_INTEGRATION_LEGACY_KEY \
  --new-key    env:STEWARDLY_INTEGRATION_KEY \
  --rotate-keys
```

### 3.4 Migrate document vault tenant keys

By default this only migrates the wrapped DEKs (fast). Pass
`--re-encrypt-blobs` to also re-encrypt every blob — only do this if
you intend to retire the legacy master key.

```bash
python3 migrations/scripts/12_migrate_document_vault.py \
  --dump /home/mike/stewardly-ai-prod-2026-05-06.sql \
  --target-url $DATABASE_URL \
  --legacy-master-key env:STEWARDLY_VAULT_LEGACY_MASTER_KEY \
  --new-master-key    env:STEWARDLY_VAULT_MASTER_KEY
```

### 3.5 Import Pass-162 artifacts

```bash
python3 migrations/scripts/13_import_pass162_artifacts.py \
  --dump /home/mike/stewardly-ai-prod-2026-05-06.sql \
  --target-url $DATABASE_URL
```

### 3.6 Validate

```bash
mysql $DATABASE_URL < migrations/runbooks/validation-queries.sql
```

**Acceptance bars:**

| Query | Expected |
|-------|----------|
| `users_count` | ≥ count from stewardly-ai dump |
| `tasks_count` | ≥ count from stewardly-ai dump |
| `orphan_messages` | `0` |
| `vault_tenants_with_new_wrap` | = number of distinct tenants with vault data |
| `persona_learnings_count` | ≥ count from stewardly-ai dump |

If any check fails, **roll back via the backup taken in step 1**.

---

## 4. Or, the one-shot path

```bash
./migrations/scripts/run_all.sh /home/mike/stewardly-ai-prod-2026-05-06.sql
```

This runs steps 3.1–3.6 in order and halts on the first error.

---

## 5. After-migration

* Tail `migrations/dry-run/run-*.log` and confirm no warnings.
* Issue a `WARM_RESTART` to all v3 app instances so they pick up the
  new schema.
* Run the 5-persona smoke suite (Phase 5 §3) and confirm zero failures.
* Begin DNS cutover (Phase 5 §4).
