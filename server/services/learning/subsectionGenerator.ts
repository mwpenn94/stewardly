/**
 * Subsection Generator
 *
 * The upstream emba_modules tracks_data.json provides full subsection
 * body text for one chapter per track (the "Supplementary Scenarios"
 * chapter). The remaining chapters are header-only stubs which render
 * as "No subsections in this chapter" in the UI.
 *
 * This module uses the platform LLM to generate professionally-written
 * educational subsections (title + paragraphs) for any chapter that
 * has zero subsections, so every chapter has substantive study content.
 *
 * Idempotent: only fills chapters whose subsection count is currently 0.
 */
import { invokeLLM } from "../../_core/llm";
import { logger } from "../../_core/logger";
import {
  listChaptersForTrack,
  listSubsectionsForChapter,
  createSubsection,
} from "./content";
import { getDb } from "../../db-ai";
import { learningTracks } from "../../../drizzle/schema-ai";
import { sql } from "drizzle-orm";

const log = logger.child({ module: "learning/subsectionGenerator" });

export interface GeneratedSubsection {
  title: string;
  paragraphs: string[];
  level: number;
}

export interface ChapterFillResult {
  trackSlug: string;
  trackName: string;
  chapterId: number;
  chapterTitle: string;
  inserted: number;
  errors: string[];
}

export interface FillRunResult {
  ok: boolean;
  chaptersProcessed: number;
  chaptersFilled: number;
  subsectionsInserted: number;
  results: ChapterFillResult[];
  durationMs: number;
}

const TARGET_SUBSECTIONS_PER_CHAPTER = 4;

export async function generateSubsectionsForChapter(
  trackName: string,
  trackSlug: string,
  chapterTitle: string,
  count: number = TARGET_SUBSECTIONS_PER_CHAPTER,
): Promise<GeneratedSubsection[]> {
  if (count <= 0) return [];

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert financial services educator writing study materials for the "${trackName}" certification track. Generate ${count} substantive subsections for the chapter titled "${chapterTitle}". Each subsection should:
- Have a clear, exam-relevant section title (e.g. "1.1 Suitability Standards", "Risk Tolerance Assessment")
- Contain 2-4 paragraphs of comprehensive, professionally-written educational content
- Cover key concepts, regulations, definitions, formulas, examples, and scenarios appropriate for ${trackName}
- Be self-contained and pedagogically sound — a learner should understand the concept after reading
- Use precise terminology and cite relevant regulations, code sections, or industry standards where applicable
- Avoid filler text, marketing language, or generic platitudes

Return ONLY valid JSON. No markdown fences.`,
        },
        {
          role: "user",
          content: `Generate ${count} subsections for the chapter "${chapterTitle}" in the "${trackName}" track. Return JSON:
{"subsections": [{"title": "...", "paragraphs": ["para 1", "para 2", "para 3"], "level": 2}]}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "subsections",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subsections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    paragraphs: { type: "array", items: { type: "string" } },
                    level: { type: "integer" },
                  },
                  required: ["title", "paragraphs", "level"],
                  additionalProperties: false,
                },
              },
            },
            required: ["subsections"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return [];
    const parsed = JSON.parse(content);
    const subs = parsed.subsections || parsed;
    if (!Array.isArray(subs)) return [];
    return subs
      .filter(
        (s: any) =>
          s.title &&
          Array.isArray(s.paragraphs) &&
          s.paragraphs.length > 0,
      )
      .slice(0, count)
      .map((s: any) => ({
        title: s.title,
        paragraphs: s.paragraphs,
        level: typeof s.level === "number" ? s.level : 2,
      }));
  } catch (err) {
    log.warn(
      { err: String(err), trackSlug, chapterTitle },
      "generateSubsectionsForChapter failed",
    );
    return [];
  }
}

/**
 * Fill every chapter (across all tracks) that currently has zero
 * subsections with LLM-generated educational content.
 *
 * Optionally limit to a single track via `trackSlug`.
 */
export async function fillEmptyChapters(opts?: {
  trackSlug?: string;
  perChapter?: number;
  maxChapters?: number;
}): Promise<FillRunResult> {
  const started = Date.now();
  const perChapter = opts?.perChapter ?? TARGET_SUBSECTIONS_PER_CHAPTER;
  const maxChapters = opts?.maxChapters ?? 1000;
  const result: FillRunResult = {
    ok: true,
    chaptersProcessed: 0,
    chaptersFilled: 0,
    subsectionsInserted: 0,
    results: [],
    durationMs: 0,
  };

  const db = await getDb();
  if (!db) {
    result.ok = false;
    return result;
  }

  // Fetch all tracks (or one)
  const tracks = await db
    .select()
    .from(learningTracks)
    .where(opts?.trackSlug ? sql`slug = ${opts.trackSlug}` : sql`1 = 1`);

  for (const track of tracks) {
    if (result.chaptersProcessed >= maxChapters) break;
    const chapters = await listChaptersForTrack(track.id);
    for (const ch of chapters) {
      if (result.chaptersProcessed >= maxChapters) break;
      result.chaptersProcessed += 1;

      const existing = await listSubsectionsForChapter(ch.id);
      if (existing.length > 0) continue;

      const cr: ChapterFillResult = {
        trackSlug: track.slug,
        trackName: track.name,
        chapterId: ch.id,
        chapterTitle: ch.title,
        inserted: 0,
        errors: [],
      };

      const generated = await generateSubsectionsForChapter(
        track.name,
        track.slug,
        ch.title,
        perChapter,
      );

      let order = 0;
      for (const sub of generated) {
        const row = await createSubsection({
          chapterId: ch.id,
          title: sub.title,
          level: sub.level,
          paragraphs: sub.paragraphs,
          tables: undefined,
          sortOrder: order++,
          createdBy: null,
        });
        if (row) cr.inserted += 1;
      }

      if (cr.inserted > 0) {
        result.chaptersFilled += 1;
        result.subsectionsInserted += cr.inserted;
      } else {
        cr.errors.push("LLM returned no usable subsections");
      }
      result.results.push(cr);
      log.info(
        {
          trackSlug: track.slug,
          chapterId: ch.id,
          chapterTitle: ch.title,
          inserted: cr.inserted,
        },
        "fillEmptyChapters: chapter processed",
      );
    }
  }

  result.durationMs = Date.now() - started;
  log.info(
    {
      processed: result.chaptersProcessed,
      filled: result.chaptersFilled,
      subsections: result.subsectionsInserted,
      durationMs: result.durationMs,
    },
    "fillEmptyChapters complete",
  );
  return result;
}
