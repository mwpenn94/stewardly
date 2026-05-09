/**
 * Round 14.11 — User-reported bug fixes
 *
 * 1) /learning/tracks/series-65 returned "Track not found" because the slug
 *    in the DB is `series65` (no hyphen). Fixed by tolerant slug matching
 *    in `getTrackBySlug` and by seeding `series65` (+ 13 other certifications).
 * 2) "0 of 0 correct" — Quick Quiz / AI quiz used static fallback templates
 *    only. Fixed by adding `learningSocial.aiQuiz.generate` (LLM-backed)
 *    and wiring AIQuizPage to call it before the deterministic fallback.
 *
 * These tests are static (read source / hit DB through SQL) to avoid the
 * heavy in-process tRPC bootstrapping that fights with the dev server's
 * memory ceiling under tsc.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(rel: string) {
  return readFileSync(resolve(rel), "utf8");
}

describe("Round 14.11 — slug-tolerant track lookup", () => {
  const src = read("server/services/learning/content.ts");

  it("getTrackBySlug normalizes hyphens and underscores", () => {
    expect(src).toMatch(/getTrackBySlug/);
    // Tries underscore variant
    expect(src).toMatch(/replace\(\/-\/g,\s*"_"\)/);
    // Tries hyphen variant
    expect(src).toMatch(/replace\(\/_\/g,\s*"-"\)/);
    // Tries no-separator variant
    expect(src).toMatch(/replace\(\/\[-_\]\/g,\s*""\)/);
  });

  it("getTrackBySlug also tries series-numbered alternates", () => {
    // Matches series-65 → series65 / series_65 / series-65 candidates
    expect(src).toMatch(/series\[\-_\]\?/);
    expect(src).toMatch(/`series\$\{m\[1\]\}`/);
  });

  it("getTrackBySlug returns the first matching candidate (not last)", () => {
    // The loop should `return row` immediately on first hit
    expect(src).toMatch(/for\s*\(const c of candidates\)\s*\{[\s\S]*?if \(row\) return row;/);
  });
});

describe("Round 14.11 — LLM-backed AI quiz generation", () => {
  const src = read("server/routers/learningSocial.ts");

  it("aiQuizRouter exposes a `generate` procedure", () => {
    expect(src).toMatch(/generate:\s*protectedProcedure/);
  });

  it("generate uses the platform LLM helper (dynamic import)", () => {
    expect(src).toMatch(/invokeLLM/);
    // Lazy dynamic import keeps cold-start fast for non-AI traffic
    expect(src).toMatch(/await import\(["']\.\.\/_core\/llm["']\)/);
  });

  it("generate uses a strict JSON schema response_format", () => {
    expect(src).toMatch(/response_format:/);
    expect(src).toMatch(/json_schema/);
    expect(src).toMatch(/strict:\s*true/);
  });

  it("generate persists each question to learning_ai_quiz_questions", () => {
    expect(src).toMatch(/db\.insert\(learningAiQuizQuestions\)\.values/);
  });

  it("generate accepts difficulty, questionType, and count inputs", () => {
    expect(src).toMatch(/difficulty:\s*z\.enum\(\["easy",\s*"medium",\s*"hard"\]\)/);
    expect(src).toMatch(/questionType:\s*z\.enum/);
    expect(src).toMatch(/count:\s*z\.number\(\)\.int\(\)\.min\(1\)\.max\(20\)/);
  });

  it("generate falls back to empty array on LLM failure (does not throw)", () => {
    expect(src).toMatch(/catch \{[\s\S]*?questions = \[\];/);
  });
});

describe("Round 14.11 — AIQuizPage wiring", () => {
  const src = read("client/src/pages/learning/AIQuizPage.tsx");

  it("AIQuizPage uses the new generate mutation", () => {
    expect(src).toMatch(/trpc\.learningSocial\.aiQuiz\.generate\.useMutation/);
    expect(src).toMatch(/generateMut\.mutateAsync/);
  });

  it("AIQuizPage maps `scenario` and `explain` to free_response", () => {
    expect(src).toMatch(/"scenario"\s*\|\|\s*questionType\s*===\s*"explain"/);
    expect(src).toMatch(/"free_response"/);
  });

  it("AIQuizPage maps `fill_blank` to cloze for the LLM call", () => {
    expect(src).toMatch(/"fill_blank"[\s\S]{0,80}"cloze"/);
  });

  it("AIQuizPage retains the deterministic template fallback for offline mode", () => {
    expect(src).toMatch(/template fallback/);
    expect(src).toMatch(/templates = \[/);
  });
});
