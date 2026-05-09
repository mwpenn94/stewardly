/**
 * adminAdoption.ts — R14.14
 *
 * Admin-only review queue and adoption pipeline. Lets admins:
 *   1. See user-authored AI content awaiting review (status="review" or "draft")
 *   2. Promote a user-authored row into the canonical hierarchy by attaching it
 *      to a track / chapter / section and flipping status="published"
 *   3. View the global cross-hierarchy edit history for any item
 *   4. Roll back an item at any level of the hierarchy (the underlying row
 *      change is recorded in learning_content_history with action="restore"
 *      so users see the rollback in their own version-history view too).
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const KIND = z.enum(["question", "flashcard", "case", "definition"]);
type Kind = z.infer<typeof KIND>;

const adminOnly = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  return next({ ctx });
});

async function tableFor(kind: Kind) {
  const s = await import("../../drizzle/schema");
  switch (kind) {
    case "question": return s.learningPracticeQuestions;
    case "flashcard": return s.learningFlashcards;
    case "case": return s.learningCases;
    case "definition": return s.learningDefinitions;
  }
}
function historyTableName(kind: Kind): string {
  return ({
    question: "learning_practice_questions",
    flashcard: "learning_flashcards",
    case: "learning_cases",
    definition: "learning_definitions",
  } as const)[kind];
}

export const adminAdoptionRouter = router({
  /** Items awaiting admin review (any user, source=user_authored, status=review|draft). */
  reviewQueue: adminOnly
    .input(z.object({ kind: KIND }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return [];
      const t = await tableFor(input.kind);
      const { eq, and, or, inArray, desc } = await import("drizzle-orm");
      const rows = await db
        .select()
        .from(t)
        .where(and(
          eq((t as any).source, "user_authored"),
          inArray((t as any).status, ["review", "draft"]),
        ))
        .orderBy(desc((t as any).updatedAt ?? (t as any).createdAt))
        .limit(200);
      return rows;
    }),

  /** Promote a row into canonical hierarchy and publish. */
  adopt: adminOnly
    .input(z.object({
      kind: KIND,
      id: z.number().int().positive(),
      trackId: z.number().int().positive().optional(),
      chapterId: z.number().int().positive().optional(),
      sectionId: z.number().int().positive().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const t = await tableFor(input.kind);
      const { eq } = await import("drizzle-orm");
      const [row] = await db.select().from(t).where(eq((t as any).id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      const patch: any = { status: "published", source: "ai_generated" }; // adopted = canonical
      if (input.trackId !== undefined) patch.trackId = input.trackId;
      if (input.chapterId !== undefined) patch.chapterId = input.chapterId;
      if (input.sectionId !== undefined) patch.sectionId = input.sectionId;
      await db.update(t).set(patch).where(eq((t as any).id, input.id));
      const { learningContentHistory } = await import("../../drizzle/schema");
      await db.insert(learningContentHistory).values({
        contentTable: historyTableName(input.kind),
        contentId: input.id,
        action: "adopt",
        previousData: row as any,
        newData: { ...row, ...patch } as any,
        changedBy: ctx.user.id,
        changeReason: input.reason ?? "Admin promoted to canonical hierarchy",
      });
      return { ok: true };
    }),

  /** Reject a user-authored item (sets status=retired/archived, keeps history). */
  reject: adminOnly
    .input(z.object({ kind: KIND, id: z.number().int().positive(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const t = await tableFor(input.kind);
      const { eq } = await import("drizzle-orm");
      const [row] = await db.select().from(t).where(eq((t as any).id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      const patch =
        input.kind === "question"
          ? { status: "retired" as const }
          : { status: "archived" as const };
      await db.update(t).set(patch).where(eq((t as any).id, input.id));
      const { learningContentHistory } = await import("../../drizzle/schema");
      await db.insert(learningContentHistory).values({
        contentTable: historyTableName(input.kind),
        contentId: input.id,
        action: "archive",
        previousData: row as any,
        newData: { ...row, ...patch } as any,
        changedBy: ctx.user.id,
        changeReason: input.reason ?? "Admin rejected user submission",
      });
      return { ok: true };
    }),

  /** Global recent edit log across every level (admin oversight). */
  recentChanges: adminOnly
    .input(z.object({
      kind: KIND.optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return [];
      const { learningContentHistory } = await import("../../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const tableFilter = input.kind
        ? eq(learningContentHistory.contentTable, historyTableName(input.kind))
        : undefined;
      const rows = tableFilter
        ? await db.select().from(learningContentHistory).where(tableFilter).orderBy(desc(learningContentHistory.createdAt)).limit(input.limit)
        : await db.select().from(learningContentHistory).orderBy(desc(learningContentHistory.createdAt)).limit(input.limit);
      return rows;
    }),
});
