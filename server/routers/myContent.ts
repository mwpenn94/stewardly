/**
 * myContent.ts — R14.14
 *
 * User-facing CRUD for AI-generated study material:
 *   • Practice questions (learning_practice_questions)
 *   • Flashcards     (learning_flashcards)
 *   • Cases          (learning_cases)
 *   • Definitions    (learning_definitions)
 *
 * Every mutation appends a row to learning_content_history so users (and
 * admins) can review and roll back individual changes. The history table is
 * cross-hierarchy: any user with createdBy == ctx.user.id can read and roll
 * back their own changes, and admins can read & roll back at every level.
 *
 * Admin adoption (separate router) reads the same history table; promotion
 * from user-authored to canonical track/chapter content is a status change
 * + a history row with action="adopt".
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const KIND = z.enum(["question", "flashcard", "case", "definition"]);
type Kind = z.infer<typeof KIND>;

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

async function recordHistory(
  kind: Kind,
  contentId: number,
  action: "create" | "update" | "delete" | "restore" | "publish" | "archive" | "adopt",
  previousData: any,
  newData: any,
  userId: number,
  reason?: string,
) {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) return;
  const { learningContentHistory } = await import("../../drizzle/schema");
  await db.insert(learningContentHistory).values({
    contentTable: historyTableName(kind),
    contentId,
    action,
    previousData: previousData ?? null,
    newData: newData ?? null,
    changedBy: userId,
    changeReason: reason ?? null,
  });
}

export const myContentRouter = router({
  /** List all of the current user's AI-generated content of a given kind. */
  list: protectedProcedure
    .input(z.object({
      kind: KIND,
      includeAll: z.boolean().default(false), // admin: include other users' content
    }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return [];
      const t = await tableFor(input.kind);
      const { eq, desc, and } = await import("drizzle-orm");
      const filter =
        input.includeAll && ctx.user.role === "admin"
          ? undefined
          : eq((t as any).createdBy, ctx.user.id);
      const rows = filter
        ? await db.select().from(t).where(filter).orderBy(desc((t as any).updatedAt ?? (t as any).createdAt))
        : await db.select().from(t).orderBy(desc((t as any).updatedAt ?? (t as any).createdAt));
      return rows;
    }),

  /** Update one of the user's content rows (only their own; admins can edit any). */
  update: protectedProcedure
    .input(z.object({
      kind: KIND,
      id: z.number().int().positive(),
      patch: z.record(z.string(), z.any()),
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
      const isOwner = (row as any).createdBy === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      // Only allow whitelisted patch fields per kind to avoid privilege escalation.
      const allowed: Record<Kind, string[]> = {
        question: ["prompt", "options", "correctIndex", "explanation", "difficulty", "tags", "status"],
        flashcard: ["term", "definition", "tags", "status"],
        case: ["title", "content", "tags", "status"],
        definition: ["term", "definition", "tags", "status"],
      };
      const patch: any = {};
      for (const k of allowed[input.kind]) {
        if (k in input.patch) patch[k] = (input.patch as any)[k];
      }
      if (Object.keys(patch).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No editable fields supplied" });
      }
      await db.update(t).set(patch).where(eq((t as any).id, input.id));
      await recordHistory(input.kind, input.id, "update", row, { ...row, ...patch }, ctx.user.id, input.reason);
      return { ok: true };
    }),

  /** Soft-delete via status flip; preserves history for rollback. */
  delete: protectedProcedure
    .input(z.object({ kind: KIND, id: z.number().int().positive(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const t = await tableFor(input.kind);
      const { eq } = await import("drizzle-orm");
      const [row] = await db.select().from(t).where(eq((t as any).id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = (row as any).createdBy === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      const patch =
        input.kind === "question"
          ? { status: "retired" as const }
          : { status: "archived" as const };
      await db.update(t).set(patch).where(eq((t as any).id, input.id));
      await recordHistory(input.kind, input.id, "archive", row, { ...row, ...patch }, ctx.user.id, input.reason);
      return { ok: true };
    }),

  /** Read the version history for one row. Owner sees their own; admin sees any. */
  history: protectedProcedure
    .input(z.object({ kind: KIND, id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return [];
      const t = await tableFor(input.kind);
      const { eq, and, desc } = await import("drizzle-orm");
      const [row] = await db.select().from(t).where(eq((t as any).id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = (row as any).createdBy === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      const { learningContentHistory } = await import("../../drizzle/schema");
      const hist = await db
        .select()
        .from(learningContentHistory)
        .where(and(
          eq(learningContentHistory.contentTable, historyTableName(input.kind)),
          eq(learningContentHistory.contentId, input.id),
        ))
        .orderBy(desc(learningContentHistory.createdAt))
        .limit(100);
      return { row, history: hist };
    }),

  /** Roll back a row to a previous version captured in learning_content_history. */
  rollback: protectedProcedure
    .input(z.object({ kind: KIND, historyId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const t = await tableFor(input.kind);
      const { eq } = await import("drizzle-orm");
      const { learningContentHistory } = await import("../../drizzle/schema");
      const [hist] = await db.select().from(learningContentHistory).where(eq(learningContentHistory.id, input.historyId)).limit(1);
      if (!hist) throw new TRPCError({ code: "NOT_FOUND" });
      const targetId = hist.contentId;
      const [row] = await db.select().from(t).where(eq((t as any).id, targetId)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = (row as any).createdBy === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      const previous = hist.previousData as any;
      if (!previous || typeof previous !== "object") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Previous data not available for rollback" });
      }
      // Strip immutable fields
      const restorable = { ...previous };
      delete (restorable as any).id;
      delete (restorable as any).createdAt;
      await db.update(t).set(restorable).where(eq((t as any).id, targetId));
      await recordHistory(input.kind as Kind, targetId, "restore", row, restorable, ctx.user.id, `Rollback to history #${input.historyId}`);
      return { ok: true };
    }),

  /** Regenerate a question via LLM; saves the new prompt as a new version. */
  regenerateQuestion: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), instructions: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { learningPracticeQuestions } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [row] = await db.select().from(learningPracticeQuestions).where(eq(learningPracticeQuestions.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      const isOwner = (row as any).createdBy === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";
      if (!isOwner && !isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      const { invokeLLM } = await import("../_core/llm");
      const result = await invokeLLM({
        messages: [
          { role: "system", content: "Rewrite the financial-licensing practice question while preserving its intent. Output JSON only." },
          { role: "user", content: `Original prompt: ${row.prompt}\nOriginal options: ${JSON.stringify(row.options)}\nOriginal correctIndex: ${row.correctIndex}\nOriginal explanation: ${row.explanation ?? ""}\n\nUser instructions: ${input.instructions ?? "Improve clarity, keep the correct answer the same conceptually."}` },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "regenerated_question",
            strict: true,
            schema: {
              type: "object",
              properties: {
                prompt: { type: "string" },
                options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                correctIndex: { type: "integer", minimum: 0, maximum: 3 },
                explanation: { type: "string" },
              },
              required: ["prompt", "options", "correctIndex", "explanation"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = result.choices?.[0]?.message?.content ?? "";
      let parsed: any = null;
      try { parsed = JSON.parse(typeof content === "string" ? content : ""); } catch { /* ignore */ }
      if (!parsed?.prompt) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "LLM returned malformed JSON" });
      const patch = {
        prompt: parsed.prompt,
        options: parsed.options,
        correctIndex: parsed.correctIndex,
        explanation: parsed.explanation,
      };
      await db.update(learningPracticeQuestions).set(patch).where(eq(learningPracticeQuestions.id, input.id));
      await recordHistory("question", input.id, "update", row, { ...row, ...patch }, ctx.user.id, "Regenerated by AI");
      return { ok: true, patch };
    }),
});
