#!/usr/bin/env python3
"""Phase 3 tooling — build the merged Drizzle schema for migration generation.

Strategy
--------
The runtime project's `drizzle/schema.ts` is the foundation schema (authoritative
for the foundation's typed surfaces). This script does NOT modify that file.
Instead, it produces `drizzle/schema.merged.ts`, which:

1. Imports nothing from drizzle-orm directly; it re-exports everything in
   `drizzle/schema.ts` (so foundation-typed surfaces still build).
2. Adds the 414 SAI-only tables verbatim from the parser output.
3. Augments `users`, `tasks`, `user_preferences` with the additional columns
   from stewardly-ai.

The runtime schema (`drizzle/schema.ts`) keeps the foundation tables for
`@/server/_core/db.ts` consumers. The migration-generation pipeline uses
`drizzle/schema.merged.ts` so the resulting `0048_*.sql` migration includes
all additive tables and additive columns.

The drizzle-kit step is then:

    DRIZZLE_SCHEMA=drizzle/schema.merged.ts pnpm drizzle-kit generate \\
      --schema drizzle/schema.merged.ts --out drizzle --dialect mysql \\
      --custom

Note
----
Running drizzle-kit requires `DATABASE_URL`. The runbook explains the
two acceptable values:
  - Production prod URL (real run on the staging clone first)
  - A local MySQL container's URL (for verification)
"""
from __future__ import annotations
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
FOUNDATION = REPO / "drizzle" / "schema.ts"
ADDITIVE = REPO / "migrations" / "inputs" / "additive-tables.ts"
SAI = REPO / "migrations" / "inputs" / "sai-drizzle-schema.ts"
OUT = REPO / "drizzle" / "schema.merged.ts"

OVERLAP = ["users", "tasks", "user_preferences"]


def parse_columns_block(text: str, db_name: str) -> tuple[str, str] | None:
    """Returns (export_const_name, columns-only TS body) for `mysqlTable("<db_name>")`."""
    m = re.search(rf'export const (\w+) = mysqlTable\("{re.escape(db_name)}"\s*,\s*\{{', text)
    if not m:
        return None
    rest = text[m.end():]
    # Find end of the `{...}` columns dict — the first balanced `}` at indent 0.
    # We approximate by locating `\n}` followed by either `, (table) =>` or `\n);`.
    sep = re.search(r'\n\}\s*,\s*\(table\)\s*=>', rest)
    end_simple = re.search(r'\n\}\);\s*\n', rest)
    if sep and (not end_simple or sep.start() < end_simple.start()):
        body_end = sep.start()
    elif end_simple:
        body_end = end_simple.start()
    else:
        return None
    return m.group(1), rest[:body_end]


def extract_column_lines(body: str) -> list[tuple[str, str]]:
    """Return list of (camelCase_name, full_line) — preserving comments only on
    the column definition line itself."""
    out: list[tuple[str, str]] = []
    for line in body.splitlines():
        m = re.match(r'^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*[a-zA-Z]+\s*(?:<[^>]+>)?\s*\(', line)
        if m:
            out.append((m.group(2), line.rstrip()))
    return out


def build_merged() -> str:
    found = FOUNDATION.read_text()
    sai = SAI.read_text()
    additive = ADDITIVE.read_text()

    # Strip the foundation header (we re-export from foundation directly to
    # preserve types) — but for drizzle-kit we need everything inlined.
    # Drizzle-kit reads the schema file as a Drizzle table source — re-exports
    # via `export *` are honored. So we'll just re-export the foundation
    # schema then inline the additive tables and the augmented overlap tables.

    out: list[str] = []
    out.append("// AUTO-GENERATED — Stewardly v3 merged schema for drizzle-kit generation.\n")
    out.append("// Re-run scripts/03_build_merged_schema.py to regenerate.\n")
    out.append("// Source files: drizzle/schema.ts (foundation), migrations/inputs/additive-tables.ts.\n\n")
    out.append('// 1) Re-export foundation tables as-is.\n')
    out.append('export * from "./schema";\n\n')

    # 2) Inline additive tables (414).
    # We need to bring along the imports, since drizzle-kit parses each file in isolation.
    # Use the same imports stewardly-ai's schema used.
    out.append('// 2) Imports for additive tables (mirrors stewardly-ai/drizzle/schema.ts).\n')
    out.append('import {\n')
    out.append('  int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float,\n')
    out.append('  boolean as mysqlBoolean, bigint, decimal, date, index, uniqueIndex, double,\n')
    out.append('} from "drizzle-orm/mysql-core";\n')
    out.append('import { nanoid } from "nanoid";\n\n')

    out.append('// 3) Additive tables ported from stewardly-ai (414 tables, additive-only).\n')
    # Strip the comment header from additive-tables.ts so we don't double-comment.
    add_body = additive
    add_body = re.sub(r'^//.*\n', '', add_body, flags=re.MULTILINE).lstrip()
    out.append(add_body)
    out.append('\n\n')

    # 4) Augment overlap tables — add the new columns alongside the foundation columns
    #    by declaring SAI-aliased augmentation tables. For MySQL Drizzle this needs to
    #    *replace* the foundation table to extend it; we cannot simply add columns at the
    #    type level. Therefore we choose a different mechanism:
    #
    #    The merged schema declares the overlap tables a second time under aliased
    #    EXPORT NAMES (`usersStewardlyExt`, etc.) but pointing to the same DB table.
    #    drizzle-kit, when generating, sees both definitions of the same DB table and
    #    diffs ADDITIVELY (it issues `ALTER TABLE ... ADD COLUMN` for every column in
    #    the second definition that isn't already present in the first).
    #
    #    Because drizzle-kit's behavior on duplicate table names is to merge columns
    #    rather than error, this gives us the safest additive ALTER without ever
    #    mutating the foundation.

    out.append('// 4) Overlap-table augmentations — additive columns from stewardly-ai.\n')
    out.append('//    Same physical MySQL table, so drizzle-kit emits ALTER TABLE ... ADD COLUMN.\n')
    for table in OVERLAP:
        sai_block = parse_columns_block(sai, table)
        found_block = parse_columns_block(found, table)
        if not sai_block or not found_block:
            continue
        sai_export, sai_body = sai_block
        _, found_body = found_block
        sai_cols = {c[0]: c[1] for c in extract_column_lines(sai_body)}
        found_cols = {c[0] for c in extract_column_lines(found_body)}
        new_cols = [(name, line) for name, line in extract_column_lines(sai_body) if name not in found_cols]
        if not new_cols:
            continue
        ext_name = f"{sai_export}StewardlyExt"
        out.append(f"export const {ext_name} = mysqlTable(\"{table}\", {{\n")
        out.append("  // Foundation primary key (kept identical so drizzle-kit recognizes the table)\n")
        # Re-declare the PK so drizzle-kit treats this as a valid table.
        out.append("  id: int(\"id\").autoincrement().primaryKey(),\n")
        for _, line in new_cols:
            # Strip leading whitespace then re-indent.
            stripped = line.lstrip()
            out.append(f"  {stripped}\n")
        out.append("});\n\n")

    return "".join(out)


def main() -> None:
    OUT.write_text(build_merged())
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
