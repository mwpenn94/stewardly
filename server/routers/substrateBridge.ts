/**
 * Wave B.5 — Hub / TaskChat shared-substrate parity bridge
 * =========================================================
 *
 * STEWARDLY v3 §3 (Commitment C-25):
 *   "Hub (persistent artifact surface) and TaskChat (conversational
 *    surface) are complementary first-class front doors over a SHARED
 *    PERSISTENT SUBSTRATE. Neither is subordinate to the other."
 *
 * Before this bridge existed, Hub read `hubItems` and TaskView read
 * `workspaceArtifacts` separately, with no link between them: an
 * artifact created during a task did not appear on the Hub unless the
 * user manually ran the import flow with all metadata. This created the
 * appearance of two independent stores when there is, architecturally,
 * one substrate.
 *
 * This router exposes three procedures that bind the two surfaces to
 * the same persistent substrate:
 *
 *   • promoteArtifactToHub(taskId, artifactId, ...)
 *       — One-button "send to Hub" from inside a TaskView. Creates a
 *         `hubItems` row of `itemType="artifact"` whose `payload`
 *         references the workspace artifact by id, so the Hub tile and
 *         the original task artifact share storage.
 *
 *   • listHubArtifactsForTask(taskId)
 *       — Returns the hubItems that were promoted from this task. Lets
 *         TaskView show "this task's artifacts on Hub" inline.
 *
 *   • substrateSnapshot()
 *       — Returns the unified per-user substrate slice that both Hub
 *         and TaskView read: counts of memory entries, hub items,
 *         workspace artifacts, and the user's task count. Both surfaces
 *         use the same numbers; tests pin that.
 *
 * The bridge is intentionally thin: it does not duplicate data, it
 * cross-references existing tables. The substrate is the database; the
 * bridge is the contract that says both surfaces must read it through
 * the same procedures.
 */

import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb, verifyTaskOwnershipById } from "../db";
import {
  hubItems,
  workspaceArtifacts,
  memoryEntries,
  tasks,
} from "../../drizzle/schema";

/**
 * Payload shape stored on a hubItems row that was promoted from a
 * workspace artifact. The `source` discriminator lets future bridges
 * (e.g., note-bridge, conversation-bridge) coexist on the same column.
 */
export interface PromotedArtifactPayload {
  source: "workspace";
  taskId: number;
  artifactId: number;
  artifactType: string;
  promotedAt: number;
}

const promoteSchema = z.object({
  taskId: z.number().int().positive(),
  artifactId: z.number().int().positive(),
  label: z.string().trim().min(1).max(200).optional(),
  pageIndex: z.number().int().min(0).max(99).default(0),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

const listForTaskSchema = z.object({
  taskId: z.number().int().positive(),
});

export const substrateBridgeRouter = router({
  /**
   * Promote a workspace artifact to the Hub. The promoted hub tile
   * carries a payload that references the original artifact, so the
   * Hub tile and the in-task artifact view share a single source of
   * truth for content.
   */
  promoteArtifactToHub: protectedProcedure
    .input(promoteSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // 1) Verify ownership of the task — refuses cross-tenant promotion.
      await verifyTaskOwnershipById(input.taskId, ctx.user.id);

      // 2) Resolve the artifact and confirm it belongs to that task.
      const [artifact] = await db
        .select()
        .from(workspaceArtifacts)
        .where(
          and(
            eq(workspaceArtifacts.id, input.artifactId),
            eq(workspaceArtifacts.taskId, input.taskId),
          ),
        )
        .limit(1);
      if (!artifact) {
        throw new Error("Stewardly: artifact not found for the supplied task.");
      }

      // 3) Compose the hubItems row. Label defaults to artifact.label or
      //    a humanized fallback derived from artifactType.
      const label =
        input.label ??
        artifact.label ??
        humanizeArtifactType(artifact.artifactType);

      const payload: PromotedArtifactPayload = {
        source: "workspace",
        taskId: input.taskId,
        artifactId: input.artifactId,
        artifactType: artifact.artifactType,
        promotedAt: Date.now(),
      };

      const [row] = await db
        .insert(hubItems)
        .values({
          ownerUserId: ctx.user.id,
          itemType: "artifact",
          label,
          appId: null,
          builtinId: null,
          icon: null,
          color: null,
          payload: payload as unknown as Record<string, unknown>,
          pageIndex: input.pageIndex,
          sortOrder: input.sortOrder,
          parentFolderId: null,
          visibility: "private",
        })
        .$returningId();

      return { hubItemId: (row as { id: number }).id };
    }),

  /**
   * List the hub items that were promoted from a given task. Returns
   * an empty array if no promotion has happened yet. Verifies task
   * ownership before reading.
   */
  listHubArtifactsForTask: protectedProcedure
    .input(listForTaskSchema)
    .query(async ({ ctx, input }) => {
      await verifyTaskOwnershipById(input.taskId, ctx.user.id);
      const db = await getDb();
      const rows = await db
        .select()
        .from(hubItems)
        .where(
          and(
            eq(hubItems.ownerUserId, ctx.user.id),
            eq(hubItems.itemType, "artifact"),
            sql`JSON_EXTRACT(${hubItems.payload}, '$.source') = 'workspace'`,
            sql`JSON_EXTRACT(${hubItems.payload}, '$.taskId') = ${input.taskId}`,
          ),
        );
      return rows;
    }),

  /**
   * The unified substrate snapshot. Returns the counts that both Hub
   * and TaskView should agree on. If they disagree, one of them is
   * reading something other than the substrate.
   */
  substrateSnapshot: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = ctx.user.id;

    // Memory entries (Contextual engine slice)
    const [memCount] = await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(memoryEntries)
      .where(eq(memoryEntries.userId, userId));

    // Hub items (Hub surface)
    const [hubCount] = await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(hubItems)
      .where(eq(hubItems.ownerUserId, userId));

    // User tasks
    const [taskCount] = await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(tasks)
      .where(eq(tasks.userId, userId));

    // Workspace artifacts across this user's tasks. The artifact table
    // doesn't carry userId directly; we count via task ownership.
    const [artifactCount] = await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(workspaceArtifacts)
      .innerJoin(tasks, eq(workspaceArtifacts.taskId, tasks.id))
      .where(eq(tasks.userId, userId));

    return {
      memoryEntries: Number(memCount?.n ?? 0),
      hubItems: Number(hubCount?.n ?? 0),
      tasks: Number(taskCount?.n ?? 0),
      workspaceArtifacts: Number(artifactCount?.n ?? 0),
      generatedAt: Date.now(),
    };
  }),
});

function humanizeArtifactType(t: string): string {
  switch (t) {
    case "browser_screenshot": return "Browser screenshot";
    case "browser_url":        return "Browser URL";
    case "code":               return "Code";
    case "terminal":           return "Terminal output";
    case "generated_image":    return "Generated image";
    case "document":           return "Document";
    case "document_pdf":       return "PDF";
    case "document_docx":      return "Word document";
    case "document_xlsx":      return "Spreadsheet";
    case "document_csv":       return "CSV";
    case "slides":             return "Slides";
    case "webapp_preview":     return "Web app preview";
    case "webapp_deployed":    return "Deployed web app";
    default:                   return t;
  }
}
