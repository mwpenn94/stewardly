import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("Round 14.13 — mobile layout & hooks-order regressions", () => {
  it("LearningQuizRunner has mobile bottom padding to clear FAB + bottom nav", () => {
    const src = read("client/src/pages/learning/LearningQuizRunner.tsx");
    // All quiz containers should include pb-36 md:pb-6
    const matches = src.match(/pb-36 md:pb-6/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  it("AIQuizPage three motion containers include mobile bottom padding", () => {
    const src = read("client/src/pages/learning/AIQuizPage.tsx");
    const matches = src.match(/pb-36 md:pb-6/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("ExamSimulator quiz containers include mobile bottom padding", () => {
    const src = read("client/src/pages/learning/ExamSimulator.tsx");
    const matches = src.match(/pb-36 md:pb-6/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("LearningHome useMemo for stats is called BEFORE the authLoading early return (fixes React error #310)", () => {
    const src = read("client/src/pages/learning/LearningHome.tsx");
    const idxUseMemo = src.indexOf("useMemo(() => {");
    const idxEarlyReturn = src.indexOf("if (authLoading)");
    expect(idxUseMemo).toBeGreaterThan(0);
    expect(idxEarlyReturn).toBeGreaterThan(0);
    expect(idxUseMemo).toBeLessThan(idxEarlyReturn);
  });

  it("MobileBottomNav lives at z-50 fixed bottom-0 (still rendering)", () => {
    const src = read("client/src/components/MobileBottomNav.tsx");
    expect(src).toMatch(/fixed\s+bottom-0/);
    expect(src).toMatch(/z-50/);
  });
});
