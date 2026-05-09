/**
 * a11y contract: every <div> that carries `aria-label` must also
 * declare a valid `role`.
 *
 * axe-core flagged a regression on `/` (StewardshipNav loading
 * skeleton) where a plain <div aria-label="Stewardship loading"> had
 * no role. The fix added role="status". This spec locks the contract
 * so no future <div aria-label=...> sneaks in without a role.
 *
 * Strategy: scan all client/src/**\/*.tsx files for `<div ... aria-label`
 * occurrences; for each one, the same opening tag must also include
 * a `role=` attribute. Multi-line opening tags are supported by
 * matching across newlines until the closing `>`.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const CLIENT_SRC = resolve(__dirname, "..", "client", "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) {
      out.push(...walk(full));
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Find every <div ...> opening tag in a source string and yield the
 * full attribute body (everything between `<div` and the matching `>`).
 * Crude but sufficient for our codebase: we don't have generated JSX
 * with `>` inside attribute values.
 */
function* iterDivOpenings(src: string): IterableIterator<{ body: string; line: number }> {
  let i = 0;
  while (i < src.length) {
    const idx = src.indexOf("<div", i);
    if (idx < 0) return;
    // Reject `<divFoo` (unlikely but safe).
    const next = src.charAt(idx + 4);
    if (!/[\s>/]/.test(next)) {
      i = idx + 4;
      continue;
    }
    const close = src.indexOf(">", idx);
    if (close < 0) return;
    const body = src.slice(idx, close + 1);
    const line = src.slice(0, idx).split("\n").length;
    yield { body, line };
    i = close + 1;
  }
}

describe("a11y: <div aria-label> must declare a role", () => {
  it("no <div> in client/src has aria-label without role", () => {
    const files = walk(CLIENT_SRC);
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, "utf8");
      for (const { body, line } of iterDivOpenings(src)) {
        if (body.includes("aria-label") && !body.includes("role=")) {
          // Allow `aria-labelledby` since that's a different attribute.
          // Our match string is "aria-label" — make sure it's not the prefix.
          const m = /aria-label(?!ledby)/.test(body);
          if (m) {
            offenders.push(`${f.replace(CLIENT_SRC, "client/src")}:${line}`);
          }
        }
      }
    }
    expect(
      offenders,
      `Found <div aria-label=...> without role:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });

  it("StewardshipNav loading skeleton declares role=status", () => {
    const src = readFileSync(
      resolve(CLIENT_SRC, "components", "StewardshipNav.tsx"),
      "utf8",
    );
    expect(src).toMatch(/role="status"[\s\S]*?aria-label="Stewardship loading"/);
  });
});
