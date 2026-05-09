#!/usr/bin/env python3
"""
Merge canonical routes from stewardly-ai-ref/client/src/App.tsx
into stewardly-v3/client/src/App.tsx.

For each <Route path="X" component={Comp} /> or <Route path="X">{() => <Comp ... />}</Route>
in ai-ref that's missing from v3:
  1. If the lazy import for `Comp` doesn't exist in v3 but the component file exists in client/src/pages, add a lazy import.
  2. Append the Route line just before the catch-all <Route component={NotFound} />.
"""

import re
import os
from pathlib import Path

V3_APP = Path("client/src/App.tsx")
AI_APP = Path("../stewardly-ai-ref/client/src/App.tsx")
V3_PAGES_DIR = Path("client/src/pages")

# 1. Read both files
v3_text = V3_APP.read_text()
ai_text = AI_APP.read_text()

# 2. Extract route paths from v3 (we don't want to add duplicates)
v3_route_paths = set()
for m in re.finditer(r'<Route\s+path=["\']([^"\']+)["\']', v3_text):
    v3_route_paths.add(m.group(1))

# Also extract bare path={...}
for m in re.finditer(r'<Route\s+path=\{["\']([^"\']+)["\']\}', v3_text):
    v3_route_paths.add(m.group(1))

print(f"v3 has {len(v3_route_paths)} existing routes")

# 3. Extract route lines from ai-ref
# Match patterns: <Route path="X" component={Comp} /> | <Route path={"X"} component={Comp} /> | <Route path="X">{() => <Comp />}</Route>
route_pattern = re.compile(
    r'<Route\s+path=(?:["\']([^"\']+)["\']|\{["\']([^"\']+)["\']\})\s*'
    r'(?:component=\{(\w+)\}\s*/>'
    r'|>\{\(\)\s*=>\s*<(\w+)(?:\s+[^/>]*)?\s*/?>\}</Route>)',
    re.MULTILINE
)

ai_routes = []  # list of (path, component_name, source_line)
for m in route_pattern.finditer(ai_text):
    path = m.group(1) or m.group(2)
    comp = m.group(3) or m.group(4)
    ai_routes.append((path, comp))

print(f"ai-ref has {len(ai_routes)} routes total")

# 4. Filter to only those whose path is missing from v3 AND whose component file exists in v3 pages
def find_component_file(comp_name):
    """Search V3_PAGES_DIR recursively for a file that defines or default-exports `comp_name`."""
    for root, _, files in os.walk(V3_PAGES_DIR):
        for f in files:
            if not (f.endswith(".tsx") or f.endswith(".ts")): continue
            base = f.rsplit(".", 1)[0]
            if base == comp_name:
                rel = Path(root, f).relative_to(Path("client/src")).as_posix().rsplit(".", 1)[0]
                return f"@/{rel}"
    return None

missing_routes = []
not_found = []
for path, comp in ai_routes:
    if path in v3_route_paths:
        continue
    import_path = find_component_file(comp)
    if not import_path:
        not_found.append((path, comp))
        continue
    missing_routes.append((path, comp, import_path))

print(f"Missing routes (component file found): {len(missing_routes)}")
print(f"Missing routes (component file NOT in v3): {len(not_found)}")
if not_found:
    print("  Skipping these (no v3 page file):")
    for p, c in not_found[:20]:
        print(f"    {p} -> {c}")
    if len(not_found) > 20: print(f"    ... and {len(not_found)-20} more")

# 5. Build the lazy import block + Route lines to insert
# Find which components already have a lazy import in v3
v3_imports = set()
for m in re.finditer(r'(?:const|import)\s+(\w+)\s*=\s*lazy\s*\(\s*\(\)\s*=>\s*import', v3_text):
    v3_imports.add(m.group(1))
# Also static imports
for m in re.finditer(r'^import\s+(\w+)\s+from\s+["\']@/pages/', v3_text, re.MULTILINE):
    v3_imports.add(m.group(1))

new_imports = []
new_routes = []
seen_comps = set()
for path, comp, import_path in missing_routes:
    if comp not in v3_imports and comp not in seen_comps:
        new_imports.append(f'const {comp} = lazy(() => import("{import_path}"));')
        seen_comps.add(comp)
    new_routes.append(f'      <Route path="{path}" component={{{comp}}} />')

# 6. Insert into v3 App.tsx
# Place new_imports just before "function Router(" (after all existing lazy declarations)
# Place new_routes just before the catch-all <Route component={NotFound} />

# Find insertion points
# Insert imports before "function Router("
router_fn_match = re.search(r'\nfunction Router\(\)', v3_text)
if not router_fn_match:
    raise RuntimeError("Couldn't find `function Router()` in v3 App.tsx")
imports_insert = router_fn_match.start()

# Insert routes before <Route component={NotFound} /> (the bare catch-all without path)
catch_all_match = re.search(r'      <Route component=\{NotFound\} />', v3_text)
if not catch_all_match:
    raise RuntimeError("Couldn't find catch-all <Route component={NotFound} /> in v3 App.tsx")

# Build final text
imports_block = "\n// === Auto-merged lazy imports from canonical ai-ref App.tsx ===\n" + "\n".join(new_imports) + "\n"
routes_block = "\n      {/* === Auto-merged routes from canonical ai-ref App.tsx === */}\n" + "\n".join(new_routes) + "\n"

# Insert imports first (lower offset), then routes (higher offset, but offsets shift after imports insert)
new_text = (
    v3_text[:imports_insert]
    + imports_block
    + v3_text[imports_insert:catch_all_match.start()]
    + routes_block
    + v3_text[catch_all_match.start():]
)

V3_APP.write_text(new_text)
print(f"\nWrote {V3_APP}")
print(f"Added {len(new_imports)} lazy imports + {len(new_routes)} Route entries")
print(f"New file size: {len(new_text.splitlines())} lines (was {len(v3_text.splitlines())})")
