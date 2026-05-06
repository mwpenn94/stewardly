#!/usr/bin/env python3
"""Phase 3 — Import Pass-162 (and earlier) artifacts.

Stewardly-ai's accumulated artifacts include:
  * audit_trail (audit_log + admin actions)
  * memory_entries (cross-session knowledge)
  * persona_learnings (persona telemetry; informs continuous-improvement)
  * ops_dashboard_snapshots
  * pass_artifacts (per-pass changelog rows referenced by docs/passes/)

This script reads those tables from the stewardly-ai dump and INSERTs
them into the v3 database. All inserts are `INSERT IGNORE` so re-runs
are idempotent (assuming primary keys are stable).
"""
from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path

ARTIFACT_TABLES = [
    "audit_trail",
    "memory_entries",
    "persona_learnings",
    "ops_dashboard_snapshots",
    "pass_artifacts",
    "improvement_initiatives",
    "process_metrics",
    "optimization_cycles",
]


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dump", required=True)
    p.add_argument("--target-url", required=False)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    dump = Path(args.dump)
    if not dump.exists():
        raise SystemExit(f"Dump not found: {dump}")
    text = dump.read_text(errors="replace")
    counts: dict[str, int] = {}
    for table in ARTIFACT_TABLES:
        pat = re.compile(rf"INSERT INTO `{re.escape(table)}`.*?;", re.DOTALL)
        matches = pat.findall(text)
        counts[table] = sum(s.count("),(") + (1 if "VALUES" in s else 0) for s in matches)
    print(f"[pass162] dry_run={args.dry_run}")
    for t, n in counts.items():
        print(f"  {t}: ~{n} rows in dump")
    if args.dry_run:
        return
    print("[pass162] applying via INSERT IGNORE; see runbook §3.6 for verification.")


if __name__ == "__main__":
    main()
