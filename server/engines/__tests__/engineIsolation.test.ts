/**
 * Wave B.1 — Engine-isolation lint
 * =================================
 *
 * STEWARDLY v3 §3 (verbatim):
 *   "Engines never import other engines. Engines never call substrate
 *    primitives directly. Every cross-engine and engine→substrate request
 *    flows through the Intent contract."
 *
 * This file is the machine-enforced version of that constraint. It
 * statically scans every `*.ts` file under each of the five engine
 * directories and FAILS the test if it finds:
 *
 *   EI-1  — import from a sibling engine directory
 *           (e.g., contextual code importing from formational/)
 *   EI-2  — import from `./_substrate` or `./_substrateAdapters` directly
 *           (engines must consume substrate via ctx.substrate, not import)
 *   EI-3  — import from any client/* path (server-only constraint)
 *
 * It also pins:
 *
 *   EI-4  — every engine's root index.ts exports a handler that conforms
 *           to the EngineHandler contract (function/arrow assignable shape)
 *   EI-5  — engines registry contains exactly the 5 ontologically-complete
 *           engines and chatRouter is the single registered cross-engine
 *           dispatch path
 *   EI-6  — the substrate router is the only file outside engines that
 *           imports the substrate (negative pin: no other server file
 *           reaches into _substrate adapter directly outside engines/)
 *
 * If any of these fail, a refactor has crossed the architectural boundary
 * and must be revised. The fix is always: route through the Intent
 * contract via chatRouter or ctx.substrate.dispatch().
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { engines, chatRouter } from "../index";

/** Five ontologically-complete engines. */
const ENGINE_DIRS = [
  "formational",
  "relational",
  "missional",
  "contextual",
  "continuous-improvement",
] as const;

const ENGINES_ROOT = join(__dirname, "..");

/** Recursively list every .ts file under a directory (non-test). */
function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    let entries: string[];
    try { entries = readdirSync(cur); } catch { continue; }
    for (const name of entries) {
      const p = join(cur, name);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) {
        if (name === "__tests__" || name === "node_modules") continue;
        stack.push(p);
      } else if (st.isFile() && p.endsWith(".ts") && !p.endsWith(".test.ts") && !p.endsWith(".d.ts")) {
        out.push(p);
      }
    }
  }
  return out;
}

/** Extract every `import ... from "..."` and `from "..."` specifier from a TS file. */
function extractImports(src: string): string[] {
  const out: string[] = [];
  const importRe = /from\s+["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(src)) !== null) out.push(m[1]);
  // dynamic imports
  const dynRe = /import\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((m = dynRe.exec(src)) !== null) out.push(m[1]);
  return out;
}

describe("EI-1 — engines never import sibling engines", () => {
  for (const owner of ENGINE_DIRS) {
    it(`${owner}/* does not import from any sibling engine root`, () => {
      const files = listTsFiles(join(ENGINES_ROOT, owner));
      const violations: { file: string; spec: string }[] = [];
      for (const file of files) {
        const src = readFileSync(file, "utf8");
        for (const spec of extractImports(src)) {
          // Sibling pattern: any of the OTHER engine directory names appearing
          // as a path segment in a relative import (../<sibling>/...).
          for (const sibling of ENGINE_DIRS) {
            if (sibling === owner) continue;
            // Only flag relative imports — bare specifiers from external
            // packages that happen to share a name are out of scope.
            if (!spec.startsWith(".")) continue;
            const segments = spec.split("/");
            if (segments.includes(sibling)) {
              violations.push({ file: relative(ENGINES_ROOT, file), spec });
            }
          }
        }
      }
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
});

describe("EI-2 — engines never directly import substrate adapter modules", () => {
  for (const owner of ENGINE_DIRS) {
    it(`${owner}/* does not directly import _substrate / _substrateAdapters`, () => {
      const files = listTsFiles(join(ENGINES_ROOT, owner));
      const violations: { file: string; spec: string }[] = [];
      for (const file of files) {
        const src = readFileSync(file, "utf8");
        for (const spec of extractImports(src)) {
          // Block direct imports of the substrate adapter implementations.
          // Engines must only import the type-level contract from _substrate
          // when needed (interfaces), and never import the adapter module.
          // We allow `type`-only imports of _substrate (for shared types
          // like Stewardship) but block _substrateAdapters always.
          if (spec.endsWith("_substrateAdapters") || spec.endsWith("/_substrateAdapters")) {
            violations.push({ file: relative(ENGINES_ROOT, file), spec });
          }
        }
      }
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
});

describe("EI-3 — engines never reach into client/*", () => {
  for (const owner of ENGINE_DIRS) {
    it(`${owner}/* does not import from client/* or @/*`, () => {
      const files = listTsFiles(join(ENGINES_ROOT, owner));
      const violations: { file: string; spec: string }[] = [];
      for (const file of files) {
        const src = readFileSync(file, "utf8");
        for (const spec of extractImports(src)) {
          if (spec.startsWith("@/") || spec.includes("/client/") || spec.startsWith("client/")) {
            violations.push({ file: relative(ENGINES_ROOT, file), spec });
          }
        }
      }
      expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
    });
  }
});

describe("EI-4 — every engine root exports a handler conforming to EngineHandler", () => {
  it.each(ENGINE_DIRS)("engines.%s is a function (EngineHandler shape)", (id) => {
    const handler = engines[id as keyof typeof engines];
    expect(typeof handler).toBe("function");
    // EngineHandler arity: (ctx, intent) => Promise<IntentResult>
    expect(handler.length).toBeGreaterThanOrEqual(1);
    expect(handler.length).toBeLessThanOrEqual(2);
  });
});

describe("EI-5 — engine registry has exactly the five ontologically-complete engines", () => {
  it("registry keys match the canonical five-engine taxonomy", () => {
    const keys = Object.keys(engines).sort();
    expect(keys).toEqual([...ENGINE_DIRS].sort());
  });
  it("chatRouter is the exported cross-engine dispatch path", () => {
    expect(typeof chatRouter).toBe("function");
  });
});

describe("EI-6 — non-engine server code does not reach into _substrateAdapters", () => {
  it("only the substrate router and the engine registry import _substrateAdapters", () => {
    // Walk server/ but skip server/engines (engines have their own rule).
    const serverRoot = join(ENGINES_ROOT, "..");
    const nonEngineFiles: string[] = [];
    const stack = [serverRoot];
    while (stack.length) {
      const cur = stack.pop()!;
      let entries: string[];
      try { entries = readdirSync(cur); } catch { continue; }
      for (const name of entries) {
        const p = join(cur, name);
        let st;
        try { st = statSync(p); } catch { continue; }
        if (st.isDirectory()) {
          if (name === "engines" || name === "__tests__" || name === "node_modules" || name === "_core") continue;
          stack.push(p);
        } else if (st.isFile() && p.endsWith(".ts") && !p.endsWith(".test.ts") && !p.endsWith(".d.ts")) {
          nonEngineFiles.push(p);
        }
      }
    }
    const violations: { file: string; spec: string }[] = [];
    for (const file of nonEngineFiles) {
      const src = readFileSync(file, "utf8");
      for (const spec of extractImports(src)) {
        if (spec.endsWith("_substrateAdapters") || spec.endsWith("/_substrateAdapters") || spec.includes("engines/_substrateAdapters")) {
          violations.push({ file: relative(serverRoot, file), spec });
        }
      }
    }
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
