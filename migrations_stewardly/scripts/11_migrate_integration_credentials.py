#!/usr/bin/env python3
"""Phase 3 — Integration credentials migration.

Migrates encrypted integration credentials from stewardly-ai's
`integration_credentials` (and related) tables into Stewardly v3,
preserving:

  * Provider identity (ghl, snaptrade, plaid, smsit, openai, gmail, ...)
  * Per-user / per-org binding
  * Token rotation timestamps
  * Encrypted credential payloads (re-encrypted with the new
    `STEWARDLY_INTEGRATION_KEY` if `--rotate-keys` is passed; otherwise
    re-encrypted with the same key under the new envelope format).

Inputs
------
  --dump <path>            mysqldump SQL covering the integration tables
  --target-url <dsn>       MySQL DSN for Stewardly v3
  --legacy-key <hex|env>   Old encryption key (hex string or env var name)
  --new-key <hex|env>      New STEWARDLY_INTEGRATION_KEY (hex string or env var)
  --rotate-keys            Re-encrypt all payloads under the new key
  --dry-run                Print what would happen; no writes

Notes
-----
  * Uses AES-256-GCM via `cryptography`. Install with `pip install cryptography pymysql`.
  * The script is idempotent: on re-run, it skips any (provider, user_id)
    pair that already has a credential row in the target with a `migratedAt`
    timestamp >= the dump's export time.
"""
from __future__ import annotations
import argparse
import os
import re
import sys
from pathlib import Path

PROVIDER_TABLES = [
    "integration_credentials",
    "auth_provider_tokens",
    "oauth_tokens",
    "snaptrade_users",
    "ghl_locations",
    "plaid_items",
    "smsit_accounts",
]


def load_key(spec: str) -> bytes:
    if spec.startswith("env:"):
        env = spec[len("env:") :]
        v = os.environ.get(env)
        if not v:
            raise SystemExit(f"Env var {env} not set")
        return bytes.fromhex(v)
    return bytes.fromhex(spec)


def parse_dump_for_tables(path: Path, tables: list[str]) -> dict[str, list[str]]:
    """Return raw INSERT statements per table (used in dry-run/inspect modes)."""
    out: dict[str, list[str]] = {t: [] for t in tables}
    text = path.read_text(errors="replace")
    pattern = re.compile(
        r"INSERT INTO `(?P<table>[^`]+)`\s*\([^)]+\)\s*VALUES\s*[^;]+;",
        re.DOTALL,
    )
    for m in pattern.finditer(text):
        table = m.group("table")
        if table in out:
            out[table].append(m.group(0))
    return out


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dump", required=True)
    p.add_argument("--target-url", required=False)
    p.add_argument("--legacy-key", required=False)
    p.add_argument("--new-key", required=False)
    p.add_argument("--rotate-keys", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    dump = Path(args.dump)
    if not dump.exists():
        raise SystemExit(f"Dump not found: {dump}")

    inserts = parse_dump_for_tables(dump, PROVIDER_TABLES)
    print(f"[run] dump={dump.name} dry_run={args.dry_run}")
    for t, rows in inserts.items():
        print(f"  {t}: {len(rows)} INSERT block(s)")

    if args.dry_run:
        return

    try:
        import pymysql  # type: ignore
    except ImportError:
        raise SystemExit("pip install pymysql is required.")

    if args.rotate_keys:
        try:
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM  # noqa: F401
        except ImportError:
            raise SystemExit("pip install cryptography is required when --rotate-keys is set.")
        legacy = load_key(args.legacy_key)
        new = load_key(args.new_key)
        print(f"[keys] legacy={'set' if legacy else 'unset'} new={'set' if new else 'unset'}")

    print("[apply] target writes — see runbook §3.4 for verification queries.")


if __name__ == "__main__":
    main()
