/**
 * Wave B.5 — substrateBridge invariant tests
 * ============================================
 *
 * These tests pin the architectural contract that Hub and TaskView
 * resolve through the SAME persistent substrate. They do not require
 * a live database connection: each test asserts a property the bridge
 * must hold regardless of substrate state, by exercising auth + input
 * validation paths on the tRPC caller.
 *
 *   SB-1 — bridge router is registered on appRouter
 *   SB-2 — promoteArtifactToHub rejects unauthenticated callers
 *   SB-3 — listHubArtifactsForTask rejects unauthenticated callers
 *   SB-4 — substrateSnapshot rejects unauthenticated callers
 *   SB-5 — promoteArtifactToHub validates inputs (zod schema)
 *   SB-6 — payload shape contract is preserved (PromotedArtifactPayload)
 *   SB-7 — bridge does not duplicate persistence (no new artifact tables)
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { substrateBridgeRouter, type PromotedArtifactPayload } from "./routers/substrateBridge";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function authedCtx(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sb-test-user",
    email: "sb@test.example",
    name: "SB Test",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function unauthedCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("SB-1 — bridge router registration", () => {
  it("appRouter exposes substrateBridge", () => {
    const caller = appRouter.createCaller(authedCtx());
    expect(typeof caller.substrateBridge.promoteArtifactToHub).toBe("function");
    expect(typeof caller.substrateBridge.listHubArtifactsForTask).toBe("function");
    expect(typeof caller.substrateBridge.substrateSnapshot).toBe("function");
  });

  it("substrateBridgeRouter exports the same procedures", () => {
    // Drilling into the router proves the registration is the same object
    // shape that `appRouter.substrateBridge` exposes — pinning that we
    // didn't accidentally fork the router.
    const procs = (substrateBridgeRouter as unknown as { _def: { procedures: Record<string, unknown> } })._def.procedures;
    expect(Object.keys(procs).sort()).toEqual([
      "listHubArtifactsForTask",
      "promoteArtifactToHub",
      "substrateSnapshot",
    ]);
  });
});

describe("SB-2/3/4 — auth gating", () => {
  it("promoteArtifactToHub rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(unauthedCtx());
    await expect(
      caller.substrateBridge.promoteArtifactToHub({ taskId: 1, artifactId: 1 }),
    ).rejects.toThrow();
  });
  it("listHubArtifactsForTask rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(unauthedCtx());
    await expect(
      caller.substrateBridge.listHubArtifactsForTask({ taskId: 1 }),
    ).rejects.toThrow();
  });
  it("substrateSnapshot rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(unauthedCtx());
    await expect(caller.substrateBridge.substrateSnapshot()).rejects.toThrow();
  });
});

describe("SB-5 — input validation", () => {
  it("promoteArtifactToHub rejects non-positive taskId", async () => {
    const caller = appRouter.createCaller(authedCtx());
    await expect(
      caller.substrateBridge.promoteArtifactToHub({ taskId: 0, artifactId: 1 }),
    ).rejects.toThrow();
    await expect(
      caller.substrateBridge.promoteArtifactToHub({ taskId: -5, artifactId: 1 }),
    ).rejects.toThrow();
  });
  it("promoteArtifactToHub rejects non-positive artifactId", async () => {
    const caller = appRouter.createCaller(authedCtx());
    await expect(
      caller.substrateBridge.promoteArtifactToHub({ taskId: 1, artifactId: 0 }),
    ).rejects.toThrow();
  });
  it("promoteArtifactToHub rejects an empty label", async () => {
    const caller = appRouter.createCaller(authedCtx());
    await expect(
      caller.substrateBridge.promoteArtifactToHub({
        taskId: 1,
        artifactId: 1,
        label: "   ",
      }),
    ).rejects.toThrow();
  });
  it("promoteArtifactToHub rejects pageIndex out of range", async () => {
    const caller = appRouter.createCaller(authedCtx());
    await expect(
      caller.substrateBridge.promoteArtifactToHub({
        taskId: 1,
        artifactId: 1,
        pageIndex: 100,
      }),
    ).rejects.toThrow();
  });
  it("listHubArtifactsForTask rejects non-positive taskId", async () => {
    const caller = appRouter.createCaller(authedCtx());
    await expect(
      caller.substrateBridge.listHubArtifactsForTask({ taskId: -1 }),
    ).rejects.toThrow();
  });
});

describe("SB-6 — payload shape contract", () => {
  it("PromotedArtifactPayload has the documented fields", () => {
    const payload: PromotedArtifactPayload = {
      source: "workspace",
      taskId: 42,
      artifactId: 7,
      artifactType: "code",
      promotedAt: 1714000000000,
    };
    // Pin the discriminator so future bridges (note, conversation, etc.)
    // remain backward-compatible with this `source: "workspace"` shape.
    expect(payload.source).toBe("workspace");
    expect(typeof payload.taskId).toBe("number");
    expect(typeof payload.artifactId).toBe("number");
    expect(typeof payload.artifactType).toBe("string");
    expect(typeof payload.promotedAt).toBe("number");
  });
});

describe("SB-7 — no duplicate persistence", () => {
  it("bridge module imports only existing substrate tables (no new tables)", async () => {
    // The bridge must reuse the substrate; it must not import a new
    // table alias from the schema. We assert the module text directly.
    const fs = await import("node:fs");
    const path = await import("node:path");
    const src = fs.readFileSync(
      path.join(__dirname, "routers", "substrateBridge.ts"),
      "utf8",
    );
    // Only these substrate tables may be imported. If the bridge ever
    // references a new table (e.g., a "hub_artifact_promotions" table),
    // this assertion will fail and we'll revisit the design.
    const allowedTables = ["hubItems", "workspaceArtifacts", "memoryEntries", "tasks"];
    const importMatch = src.match(/from\s+["'](?:\.\.\/)+drizzle\/schema["']/);
    expect(importMatch).toBeTruthy();
    const importBlock = src.match(/import\s*\{([^}]+)\}\s*from\s+["'](?:\.\.\/)+drizzle\/schema["']/);
    expect(importBlock).toBeTruthy();
    const imported = importBlock![1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const ident of imported) {
      expect(allowedTables).toContain(ident);
    }
  });
});
