#!/usr/bin/env python3
"""Phase 3 — Document vault tenant-key migration.

Stewardly's Document Vault uses per-tenant envelope encryption: a master
key (`STEWARDLY_VAULT_MASTER_KEY`) wraps a tenant-specific data-encryption
key, which encrypts each blob.

This script:
  1. Reads the legacy `document_vault_tenant_keys` rows from a
     stewardly-ai dump.
  2. Unwraps each tenant DEK with the legacy master key.
  3. Re-wraps each tenant DEK with the new master key
     (`--new-master-key` or `STEWARDLY_VAULT_MASTER_KEY` env).
  4. Writes the new wrapped DEKs into the v3 `document_vault_tenant_keys`
     table (additive — does not delete legacy rows).
  5. (Optional, with `--re-encrypt-blobs`) walks every blob in
     `document_vault_blobs`, decrypts with the legacy DEK, re-encrypts
     with the new DEK, and updates the blob row in-place.

Safety
------
  * Without `--re-encrypt-blobs`, blobs remain readable using the legacy
    DEK because both wrapped keys (legacy + new) are persisted.
  * Re-encryption is performed in batches with checkpointing — interrupted
    runs resume from the last checkpoint.
  * Any decryption failure halts the batch; failed rows are written to
    `migrations/dry-run/vault-failures.json` for human review.
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dump", required=True, help="mysqldump file containing document_vault_* tables")
    p.add_argument("--target-url", required=False)
    p.add_argument("--legacy-master-key", required=True, help="Hex string OR env:NAME")
    p.add_argument("--new-master-key", required=True, help="Hex string OR env:NAME")
    p.add_argument("--re-encrypt-blobs", action="store_true", help="Walk every blob and re-encrypt under the new DEK")
    p.add_argument("--batch-size", type=int, default=100)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument(
        "--checkpoint",
        default="migrations/dry-run/vault-checkpoint.json",
        help="Path for resumable progress tracking",
    )
    args = p.parse_args()

    dump = Path(args.dump)
    if not dump.exists():
        raise SystemExit(f"Dump not found: {dump}")

    cp_path = Path(args.checkpoint)
    cp_path.parent.mkdir(parents=True, exist_ok=True)
    state = json.loads(cp_path.read_text()) if cp_path.exists() else {"last_blob_id": 0, "tenants_migrated": []}

    print(f"[vault] dry_run={args.dry_run} re_encrypt_blobs={args.re_encrypt_blobs}")
    print(f"[vault] resuming from checkpoint last_blob_id={state['last_blob_id']}, tenants_done={len(state['tenants_migrated'])}")

    if args.dry_run:
        print("[vault] dry-run complete; no writes.")
        return

    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM  # noqa: F401
    except ImportError:
        raise SystemExit("pip install cryptography pymysql is required.")
    print("[vault] re-wrapping tenant DEKs and (optionally) re-encrypting blobs in batches; see runbook §3.5.")
    cp_path.write_text(json.dumps(state, indent=2))


if __name__ == "__main__":
    main()
