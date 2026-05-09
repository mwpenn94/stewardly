/**
 * R14.14 — minimal sanity spec.
 *
 * tRPC v11 stores procedures as flat keys under `_def.procedures`, e.g.
 * `voiceAgent.decide`, `myContent.list`. We just check those exist.
 */
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

const def: any = (appRouter as any)._def;
const procs = def.procedures || def.record;

function has(path: string): boolean {
  if (procs[path]) return true;
  // Some tRPC versions nest by namespace; walk dot-paths if needed.
  const [ns, leaf] = path.split(".");
  return !!procs[ns]?.[leaf];
}

describe("R14.14 routers mount", () => {
  it("voiceAgent.decide and voiceAgent.summarize are mounted", () => {
    expect(has("voiceAgent.decide")).toBe(true);
    expect(has("voiceAgent.summarize")).toBe(true);
  });

  it("myContent CRUD + history + rollback procedures are mounted", () => {
    for (const k of [
      "myContent.list",
      "myContent.update",
      "myContent.delete",
      "myContent.history",
      "myContent.rollback",
      "myContent.regenerateQuestion",
    ]) {
      expect(has(k)).toBe(true);
    }
  });

  it("adminAdoption review queue + adopt + reject + recentChanges are mounted", () => {
    for (const k of [
      "adminAdoption.reviewQueue",
      "adminAdoption.adopt",
      "adminAdoption.reject",
      "adminAdoption.recentChanges",
    ]) {
      expect(has(k)).toBe(true);
    }
  });
});
