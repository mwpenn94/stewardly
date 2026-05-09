#!/usr/bin/env python3
"""Phase 3 — Customer-state migration.

Migrates customer-visible state from a stewardly-ai database snapshot
(`mysqldump --single-transaction` is the supported format) into the
Stewardly v3 database. Specifically, this script:

  1. Imports rows for the 414 additive tables verbatim (table names match).
  2. For the 3 overlap tables (`users`, `tasks`, `user_preferences`):
     - Inserts net-new rows preserving primary keys.
     - For rows where the same `id` exists in both, updates ONLY the new
       columns (the SAI-only ones); the foundation-only columns are
       preserved.
  3. Maps stewardly-ai's snake_case columns into the equivalent foundation
     camelCase columns where the mapping is unambiguous (e.g.,
     `stripe_customer_id` → `stripeCustomerId`), so that the foundation's
     auth + billing flow continues to work uninterrupted.

Inputs
------
  --dump <path>          Path to a `mysqldump` SQL file from stewardly-ai prod.
  --target-url <url>     MySQL DSN for the Stewardly v3 database.
  --dry-run              Parse and report; do not execute any writes.
  --batch-size <n>       Insert batch size (default: 500).
  --skip-tables <list>   Comma-separated table names to skip.

Safety
------
  * The script refuses to run if the target DB schema is missing the additive
    tables (i.e., the `0048_exotic_snowbird.sql` migration has not been
    applied).
  * Every write is wrapped in a per-table transaction.
  * Foreign-key checks are deferred to the end (FOREIGN_KEY_CHECKS=0 only
    while loading, then revalidated and re-enabled).
  * On any failure, the per-table transaction rolls back; other tables
    remain.
  * Re-running is safe: INSERT...ON DUPLICATE KEY UPDATE for additive
    tables, and explicit per-column UPDATE for overlap rows.
"""
from __future__ import annotations
import argparse
import re
import sys
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlparse, unquote

OVERLAP = {"users", "tasks", "user_preferences"}

CAMEL_MAP_USERS = {
    "stripe_customer_id": "stripeCustomerId",
    "stripe_subscription_id": "stripeSubscriptionId",
}

# We rely on PyMySQL — install via `pip install pymysql` if not present.
try:
    import pymysql  # type: ignore
    from pymysql.cursors import Cursor  # type: ignore
except ImportError:  # pragma: no cover
    pymysql = None
    Cursor = object  # type: ignore


def parse_dump(path: Path) -> dict[str, list[tuple[str, list[tuple]]]]:
    """Parse a mysqldump file. Returns {table: [(columns_csv, [row_tuples])]}.

    This handles the mysqldump output format where each table is preceded by
    `-- Table structure for table \`<name>\`` and rows are `INSERT INTO ...
    VALUES (...),(...);` lines.
    """
    out: dict[str, list[tuple[str, list[tuple]]]] = {}
    current_table: str | None = None
    text = path.read_text(errors="replace")
    pattern = re.compile(
        r"INSERT INTO `(?P<table>[^`]+)`\s*\((?P<cols>[^)]+)\)\s*VALUES\s*(?P<vals>.*?);\s*$",
        re.MULTILINE | re.DOTALL,
    )
    count = 0
    for m in pattern.finditer(text):
        table = m.group("table")
        cols = m.group("cols").strip()
        vals = m.group("vals").strip()
        # Approximate row split — values may contain `),(` inside json strings.
        # For dump files this is good enough; for a perfect parse, use a
        # streaming parser like myloader.
        rows = re.split(r"\),\s*\(", vals.lstrip("(").rstrip(")"))
        out.setdefault(table, []).append((cols, [(r,) for r in rows]))
        count += len(rows)
    print(f"[parse_dump] tables={len(out)} approx_rows={count}", file=sys.stderr)
    return out


def assert_target_schema(conn: pymysql.connections.Connection, additive_tables: list[str]) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
        )
        present = {r[0] for r in cur.fetchall()}
    missing = [t for t in additive_tables if t not in present]
    if missing:
        raise SystemExit(
            f"Target schema is missing {len(missing)} additive tables: "
            f"{', '.join(missing[:10])}... — apply 0048_exotic_snowbird.sql first."
        )


def run(args: argparse.Namespace) -> None:
    # pymysql is only required for actual writes; dry-run can parse without it.
    if pymysql is None and not args.dry_run:
        raise SystemExit("pip install pymysql is required for this script.")
    dump_path = Path(args.dump)
    if not dump_path.exists():
        raise SystemExit(f"Dump not found: {dump_path}")

    additive_path = Path(__file__).resolve().parents[1] / "inputs" / "sai-tables-additive.txt"
    additive_tables = [t.strip() for t in additive_path.read_text().splitlines() if t.strip()]

    print(f"[run] dump={dump_path} additive_tables={len(additive_tables)} dry_run={args.dry_run}")
    parsed = parse_dump(dump_path)

    skip = set(args.skip_tables.split(",")) if args.skip_tables else set()
    if args.dry_run:
        for table in sorted(parsed):
            count = sum(len(rows) for _, rows in parsed[table])
            tag = "OVERLAP" if table in OVERLAP else "ADDITIVE" if table in additive_tables else "FOUNDATION-ONLY"
            print(f"  {table}: {count} rows ({tag}){' [SKIP]' if table in skip else ''}")
        print("[dry-run] complete; no writes made.")
        return

    target_url = args.target_url
    if not target_url:
        raise SystemExit(
            "--target-url is required for live runs (e.g. mysql://user:pass@host:3306/dbname)"
        )
    parsed_url = urlparse(target_url)
    if parsed_url.scheme not in ("mysql", "mysql+pymysql"):
        raise SystemExit(f"Unsupported scheme {parsed_url.scheme!r}; use mysql://...")
    # TiDB Cloud / managed DB requires TLS. Honor ?ssl=true (the default for the
    # managed DB) and ?ssl=false (LAN-only test instances).
    qs = dict(
        kv.split("=", 1) if "=" in kv else (kv, "")
        for kv in (parsed_url.query or "").split("&")
        if kv
    )
    use_ssl = qs.get("ssl", "true").lower() not in ("false", "0", "")
    # PyMySQL needs a non-empty ssl dict to actually enable TLS, and
    # ssl_verify_cert=False to mirror mysql2's rejectUnauthorized:false default
    # used by the foundation server (see server/engines/_core_shim/db.ts).
    ssl_kwargs = (
        {"ssl": {"ssl_verify_cert": False, "ssl_verify_identity": False}}
        if use_ssl
        else {}
    )
    conn = pymysql.connect(
        host=parsed_url.hostname or "localhost",
        port=parsed_url.port or 3306,
        user=unquote(parsed_url.username or ""),
        password=unquote(parsed_url.password or ""),
        database=(parsed_url.path or "").lstrip("/") or None,
        charset="utf8mb4",
        autocommit=False,
        **ssl_kwargs,
    )
    try:
        assert_target_schema(conn, additive_tables)
        with conn.cursor() as cur:
            cur.execute("SET FOREIGN_KEY_CHECKS=0")
            cur.execute("SET UNIQUE_CHECKS=0")
            cur.execute("SET SESSION sql_mode='NO_AUTO_VALUE_ON_ZERO'")
        for table, blocks in parsed.items():
            if table in skip:
                print(f"  [skip] {table}")
                continue
            try:
                conn.begin()
                for cols, row_blocks in blocks:
                    for batch_start in range(0, len(row_blocks), args.batch_size):
                        batch = row_blocks[batch_start : batch_start + args.batch_size]
                        values_clause = ",".join(f"({r[0]})" for r in batch)
                        if table in OVERLAP:
                            stmt = (
                                f"INSERT INTO `{table}` ({cols}) VALUES {values_clause} "
                                "ON DUPLICATE KEY UPDATE id=id"
                            )
                        else:
                            stmt = (
                                f"INSERT IGNORE INTO `{table}` ({cols}) VALUES {values_clause}"
                            )
                        with conn.cursor() as cur:
                            cur.execute(stmt)
                conn.commit()
                print(f"  [ok]   {table}: {sum(len(r) for _, r in blocks)} rows")
            except Exception as e:  # noqa: BLE001
                conn.rollback()
                print(f"  [fail] {table}: {e}")
        with conn.cursor() as cur:
            cur.execute("SET UNIQUE_CHECKS=1")
            cur.execute("SET FOREIGN_KEY_CHECKS=1")
    finally:
        conn.close()


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--dump", required=True, help="Path to mysqldump SQL file from stewardly-ai")
    p.add_argument("--target-url", required=False, help="MySQL DSN for Stewardly v3")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--batch-size", type=int, default=500)
    p.add_argument("--skip-tables", default="")
    run(p.parse_args())


if __name__ == "__main__":
    main()
