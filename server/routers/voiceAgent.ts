/**
 * voiceAgent.ts — R14.14
 *
 * Server-side intent router for app-wide hands-free voice control and the
 * conversational↔applet bridge. The client speaks (or types) a request along
 * with context describing where the user currently is in the app (route,
 * applet, selection). This router asks the LLM to convert that into a
 * structured `AgentAction` the client can execute, then narrate.
 *
 * Action shapes (the client knows how to execute each one):
 *   { type: "navigate", path: string }
 *   { type: "speak",    text: string }
 *   { type: "summarize",text: string }            // text: what to summarize
 *   { type: "open_applet", applet: string }       // shows applet inline in chat
 *   { type: "form_fill",  fields: Record<string,string> }
 *   { type: "generate_questions", trackId?: number, count?: number, topic?: string }
 *   { type: "save_note",  title: string, body: string }
 *   { type: "answer",     text: string }          // plain conversational answer
 *   { type: "clarify",    question: string }      // ask the user a follow-up
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const AppletId = z.enum([
  "formational", "relational", "missional", "contextual", "continuous-improvement",
  "calculator", "tax", "estate", "insurance", "social-security", "medicare",
  "portfolio", "products", "lead-pipeline", "compliance", "import-data",
  "my-content", "platform-guide", "settings",
]);

const AgentContext = z.object({
  route: z.string().optional(),                      // e.g. "/formational"
  applet: AppletId.optional(),                       // current applet, if any
  appletState: z.record(z.string(), z.any()).optional(), // free-form state from the page
  selection: z.string().optional(),                  // currently selected text
  recentMessages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(20).optional(),
  userRole: z.enum(["admin", "user"]).optional(),
});

export const voiceAgentRouter = router({
  /**
   * Decide what action to take. Returns a single structured action plus a
   * one-sentence narration the client should speak via TTS.
   */
  decide: protectedProcedure
    .input(z.object({
      utterance: z.string().min(1).max(2000),
      context: AgentContext.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("../_core/llm");
      const { loadGuardrails } = await import("../_core/voiceGuardrails");
      const guard = await loadGuardrails({
        userId: ctx.user.id,
        globalRole: (ctx.user as any).globalRole ?? (ctx.user.role === "admin" ? "global_admin" : "user"),
      });

      // Hard refusal on prohibited topic.
      if (guard.isProhibited(input.utterance)) {
        return {
          action: { type: "answer", text: "That topic isn't enabled by your organization. Try something else." },
          narration: "That topic isn't enabled by your organization.",
        };
      }

      // Redact PII from the utterance and any selection text in context.
      const safeUtterance = guard.redact(input.utterance);
      const safeContext = input.context ? {
        ...input.context,
        selection: input.context.selection ? guard.redact(input.context.selection) : undefined,
        appletState: input.context.appletState, // structured state stays as-is
      } : undefined;
      const ctxStr = safeContext ? JSON.stringify(safeContext).slice(0, 4000) : "(no context)";
      const sys = [
        "You are Stewardly's hands-free voice agent.",
        "You translate the user's spoken or typed request into a SINGLE structured action.",
        "Always respond as JSON matching the schema. Keep narration to one short sentence.",
        "If the user wants to navigate ('open settings', 'go to learning'), use type=navigate with the right path.",
        "If they want a study quiz on the learning track they're on, use type=generate_questions.",
        "If they want a calculator embedded in the chat, use type=open_applet with the relevant applet id.",
        "You may also reference an existing Hub item by id via type=open_applet with hubItemId set; the client will resolve the right applet for it.",
        "If they want help with the page they're on, prefer summarize/answer over navigate.",
        "If the request is ambiguous, use type=clarify with a single short follow-up question.",
        guard.bypass
          ? "You have admin bypass — you may navigate to any route in the app."
          : guard.appWide
          ? `You may navigate anywhere in the app EXCEPT routes starting with: ${(guard.deniedRoutePrefixes || []).join(", ") || "(none)"}.`
          : "Stay confined to Hub-related routes only.",
        guard.promptOverlay ? `\n\nORG/PRO OVERLAY:\n${guard.promptOverlay}` : "",
      ].filter(Boolean).join(" ");
      const userMsg = `User utterance: ${safeUtterance}\n\nCurrent context: ${ctxStr}`;
      const result = await invokeLLM({
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userMsg },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "agent_action",
            strict: true,
            schema: {
              type: "object",
              properties: {
                action: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: [
                        "navigate", "speak", "summarize", "open_applet",
                        "form_fill", "generate_questions", "save_note",
                        "answer", "clarify",
                      ],
                    },
                    path: { type: "string" },
                    text: { type: "string" },
                    applet: { type: "string" },
                    hubItemId: { type: "integer" },
                    fields: { type: "object", additionalProperties: { type: "string" } },
                    trackId: { type: "integer" },
                    count: { type: "integer" },
                    topic: { type: "string" },
                    title: { type: "string" },
                    body: { type: "string" },
                    question: { type: "string" },
                  },
                  required: ["type"],
                  additionalProperties: false,
                },
                narration: { type: "string" },
              },
              required: ["action", "narration"],
              additionalProperties: false,
            },
          },
        },
      });
      const content = result.choices?.[0]?.message?.content ?? "";
      let parsed: any = null;
      try { parsed = JSON.parse(typeof content === "string" ? content : ""); } catch { /* ignore */ }
      if (!parsed?.action?.type) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Agent returned malformed action" });
      }
      // Server-side guards.
      if (parsed.action.type === "navigate" && typeof parsed.action.path === "string") {
        const path = parsed.action.path;
        if (path.startsWith("/admin/") && ctx.user.role !== "admin") {
          parsed.action = { type: "answer", text: "That section is admin-only and your account doesn't have access." };
          parsed.narration = "That's admin-only.";
        } else if (!guard.isRouteAllowed(path)) {
          parsed.action = { type: "answer", text: "That area is restricted by your admin's voice policy. Ask an admin to enable it if you need access." };
          parsed.narration = "That area is restricted.";
        }
      }
      return parsed as { action: any; narration: string };
    }),

  /** Pure summarize endpoint used by the agent action of the same name. */
  summarize: publicProcedure
    .input(z.object({ text: z.string().min(1).max(20000) }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("../_core/llm");
      const result = await invokeLLM({
        messages: [
          { role: "system", content: "Summarize the user's text in under 60 spoken words. Plain English, no bullets." },
          { role: "user", content: input.text },
        ],
      });
      return {
        summary:
          result.choices?.[0]?.message?.content?.toString?.() ??
          "I couldn't summarize that — please try again.",
      };
    }),
});
