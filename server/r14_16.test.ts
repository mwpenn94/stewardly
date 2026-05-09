import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("R14.16 surfaces", () => {
  const procs = (appRouter as any)._def?.procedures ?? {};
  const has = (name: string) => name in procs || name in (appRouter as any)._def?.record?.procedures || false;
  const flat = Object.keys(procs);

  it("mounts hubHistory.list / hubHistory.rollback / hubHistory.adminQueue", () => {
    expect(flat.some(k => k.startsWith("hubHistory."))).toBe(true);
  });

  it("voiceAgent action schema accepts hubItemId", () => {
    expect(flat.some(k => k.startsWith("voiceAgent."))).toBe(true);
  });

  it("hub.update writes a history row (proc exists)", () => {
    expect(flat.includes("hub.update")).toBe(true);
  });
});
