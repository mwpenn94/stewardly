#!/usr/bin/env python3
"""Phase-3 tooling — extract additive table blocks from the stewardly-ai
drizzle schema.

For each table that is present in stewardly-ai/drizzle/schema.ts but NOT
present in the Stewardly foundation drizzle/schema.ts, produce a single
TypeScript file (`migrations/inputs/additive-tables.ts`) containing the
verbatim Drizzle table declarations. The next script appends these into
the foundation schema, after which `pnpm drizzle-kit generate` produces
a deterministic additive SQL migration.

Reproducible: re-runs are pure; output is overwritten.
"""
from __future__ import annotations
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
FOUNDATION = REPO / "drizzle" / "schema.ts"
SAI = REPO / "migrations" / "inputs" / "sai-drizzle-schema.ts"
OUT = REPO / "migrations" / "inputs" / "additive-tables.ts"


def parse_tables(text: str) -> dict[str, tuple[str, str, int, int]]:
    """Parse `export const X = mysqlTable("Y", { ... })...` blocks.

    Returns a mapping: db_name -> (export_name, full_block_text, start, end).
    Block ends at either `\n});\n` or `\n}));\n`, whichever occurs first.
    """
    tables: dict[str, tuple[str, str, int, int]] = {}
    i = 0
    while i < len(text):
        m = re.search(r'export const (\w+) = mysqlTable\("([^"]+)"\s*,\s*\{', text[i:])
        if not m:
            break
        start = i + m.start()
        export_name, db_name = m.group(1), m.group(2)
        rest = text[i + m.end():]
        cands: list[tuple[int, int]] = []
        for pat in (r'\n[ \t]*\}\);\s*\n', r'\n[ \t]*\}\)\);\s*\n'):
            mm = re.search(pat, rest)
            if mm:
                cands.append((mm.start(), mm.end()))
        if not cands:
            i = i + m.end()
            continue
        cands.sort()
        end = i + m.end() + cands[0][1]
        tables[db_name] = (export_name, text[start:end], start, end)
        i = end
    return tables


def main() -> None:
    found_text = FOUNDATION.read_text()
    sai_text = SAI.read_text()
    found = parse_tables(found_text)
    sai = parse_tables(sai_text)
    print(f"Foundation parsed {len(found)} tables")
    print(f"SAI parsed {len(sai)} tables")
    missing = [t for t in sai if t not in found]
    print(f"Tables only in SAI: {len(missing)}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    parts = [
        "// AUTO-GENERATED — Stewardly v3 additive tables ported from stewardly-ai.\n",
        "// Re-run scripts/01_extract_additive_tables.py to regenerate.\n\n",
    ]
    for name in sorted(missing):
        parts.append(sai[name][1])
        parts.append("\n\n")
    OUT.write_text("\n".join(parts))
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
