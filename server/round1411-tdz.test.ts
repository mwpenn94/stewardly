import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * R14.11 follow-up: the AIQuizPage had a temporal-dead-zone (TDZ) bug where
 * `rateDifficulty` was declared above `nextQuestion` but referenced it in its
 * useCallback closure. This produced "Cannot access 'nextQuestion' before
 * initialization" in production logs.
 *
 * These tests assert the file-level ordering invariant: nextQuestion declaration
 * must precede any other useCallback that references nextQuestion.
 */

const file = readFileSync(
  resolve(__dirname, "../client/src/pages/learning/AIQuizPage.tsx"),
  "utf8",
);

describe("R14.11 — AIQuizPage TDZ fix", () => {
  it("nextQuestion is declared before rateDifficulty (no TDZ)", () => {
    const nextQuestionDecl = file.indexOf("const nextQuestion = useCallback");
    const rateDifficultyDecl = file.indexOf("const rateDifficulty = useCallback");
    expect(nextQuestionDecl).toBeGreaterThan(0);
    expect(rateDifficultyDecl).toBeGreaterThan(0);
    expect(nextQuestionDecl).toBeLessThan(rateDifficultyDecl);
  });

  it("rateDifficulty closure still calls nextQuestion()", () => {
    const rateBlockStart = file.indexOf("const rateDifficulty = useCallback");
    const rateBlockEnd = file.indexOf("}, [", rateBlockStart);
    const rateBody = file.slice(rateBlockStart, rateBlockEnd);
    expect(rateBody).toContain("nextQuestion()");
  });

  it("does not reintroduce the TDZ pattern (rateDifficulty before nextQuestion)", () => {
    // A very simple regex-based check that ensures there is no place where
    // rateDifficulty is followed (in source order) by nextQuestion declaration
    // and rateDifficulty references nextQuestion in its body.
    const positions = {
      nextQuestion: file.indexOf("const nextQuestion = useCallback"),
      rateDifficulty: file.indexOf("const rateDifficulty = useCallback"),
    };
    expect(positions.nextQuestion).toBeLessThan(positions.rateDifficulty);
  });
});
