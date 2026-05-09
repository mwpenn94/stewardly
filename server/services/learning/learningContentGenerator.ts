/**
 * Learning Content Generator
 * Uses LLM to generate practice questions and flashcards for tracks
 * with thin coverage. Admin-only, idempotent.
 *
 * Ported from stewardly-ai/server/services/learningContentGenerator.ts
 */
import { invokeLLM } from "../../_core/llm";
import { logger } from "../../_core/logger";

const log = logger.child({ module: "learning/learningContentGenerator" });

export interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export interface GeneratedFlashcard {
  term: string;
  definition: string;
  tags: string[];
}

export async function generateQuestionsForTrack(
  trackName: string,
  trackSlug: string,
  chapterNames: string[],
  existingCount: number,
  targetCount: number,
): Promise<GeneratedQuestion[]> {
  const needed = Math.max(0, targetCount - existingCount);
  if (needed === 0) return [];

  const batchSize = Math.min(needed, 25);
  const allQuestions: GeneratedQuestion[] = [];

  for (let batch = 0; batch < Math.ceil(needed / batchSize); batch++) {
    const count = Math.min(batchSize, needed - allQuestions.length);
    if (count <= 0) break;

    const difficultyMix = `${Math.round(count * 0.3)} easy, ${Math.round(count * 0.4)} medium, ${Math.round(count * 0.3)} hard`;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert financial services exam question writer. Generate practice questions for the "${trackName}" certification/study track. Questions should be:
- Professionally written, exam-quality multiple choice
- Cover key concepts from these chapters: ${chapterNames.join(", ")}
- Have exactly 4 options (A-D) with one correct answer
- Include a clear explanation of why the correct answer is right
- Vary in difficulty: ${difficultyMix}
- Be unique and not repeat common textbook examples

Return ONLY valid JSON. No markdown, no code fences.`,
          },
          {
            role: "user",
            content: `Generate ${count} practice questions for the "${trackName}" track. Return JSON:
{"questions": [{"prompt": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correctIndex": 0, "explanation": "...", "difficulty": "easy|medium|hard", "tags": ["topic1"]}]}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "questions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      prompt: { type: "string" },
                      options: { type: "array", items: { type: "string" } },
                      correctIndex: { type: "integer" },
                      explanation: { type: "string" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                      tags: { type: "array", items: { type: "string" } },
                    },
                    required: ["prompt", "options", "correctIndex", "explanation", "difficulty", "tags"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const questions = parsed.questions || parsed;
        if (Array.isArray(questions)) {
          allQuestions.push(...questions.filter((q: any) =>
            q.prompt && Array.isArray(q.options) && q.options.length >= 4 &&
            typeof q.correctIndex === "number" && q.explanation
          ));
        }
      }
    } catch (err) {
      log.warn({ err: String(err), trackSlug, batch }, "Failed to generate questions batch");
    }
  }

  return allQuestions.slice(0, needed);
}

export async function generateFlashcardsForTrack(
  trackName: string,
  trackSlug: string,
  chapterNames: string[],
  existingCount: number,
  targetCount: number,
): Promise<GeneratedFlashcard[]> {
  const needed = Math.max(0, targetCount - existingCount);
  if (needed === 0) return [];

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert financial services educator. Generate flashcards (term + definition pairs) for the "${trackName}" study track. Flashcards should:
- Cover key terms, concepts, formulas, and regulations
- Be concise but comprehensive in definitions
- Cover these chapters: ${chapterNames.join(", ")}
- Be suitable for exam preparation

Return ONLY valid JSON. No markdown.`,
          },
          {
            role: "user",
            content: `Generate ${needed} flashcards for the "${trackName}" track. Return JSON:
{"flashcards": [{"term": "...", "definition": "...", "tags": ["topic"]}]}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "flashcards",
            strict: true,
            schema: {
              type: "object",
              properties: {
                flashcards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      term: { type: "string" },
                      definition: { type: "string" },
                      tags: { type: "array", items: { type: "string" } },
                    },
                    required: ["term", "definition", "tags"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["flashcards"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const flashcards = parsed.flashcards || parsed;
        if (Array.isArray(flashcards)) {
          return flashcards
            .filter((f: any) => f.term && f.definition)
            .slice(0, needed);
        }
      }
  } catch (err) {
    log.warn({ err: String(err), trackSlug }, "Failed to generate flashcards");
  }

  return [];
}
