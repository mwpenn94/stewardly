import { describe, it, expect } from "vitest";
import { chatRouter } from "../index";
import { makeIntent, type IntentMeta } from "../_intent";

const meta: IntentMeta = {
  tenantId: "t1",
  practitionerId: "p1",
  originEngine: "missional",
  mission: "wealth",
  adminLevel: "supervised",
  correlationId: "test-correlation-1",
};

describe("Stewardly engines / Intent contract", () => {
  it("routes formational intents to the formational engine", async () => {
    const r = await chatRouter(makeIntent("formational.curate", { topic: "investing basics" }, { ...meta, originEngine: "formational" }));
    expect(r.ok).toBe(true);
  });

  it("routes wealth-calculate intents to the wealth-mission handler", async () => {
    const r = await chatRouter(
      makeIntent("missional.wealth.calculate", { method: "estPrem", args: ["term", 35, 1_000_000] }, meta),
    );
    expect(r.ok).toBe(true);
    expect(typeof r.data).toBe("number");
  });

  it("refuses EMBA Section 7 references at the substrate boundary", async () => {
    const r = await chatRouter(
      makeIntent(
        "formational.curate",
        { url: "https://onlinelearning.quantic.edu/" },
        { ...meta, originEngine: "formational" },
      ),
    );
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("EMBA_SECTION_7_BOUNDARY");
  });

  it("refuses compliance-class intents at automatic admin level", async () => {
    await expect(
      chatRouter(
        makeIntent(
          "missional.wealth.ce.track",
          { op: "log", course: { title: "x", provider: "y", credits: 1, completedAt: "2026-05-01" } },
          { ...meta, adminLevel: "automatic" },
        ),
      ),
    ).rejects.toThrow(/compliance-class/);
  });
});
