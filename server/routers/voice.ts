import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const voiceRouter = router({
    /** Edge TTS — high-quality neural speech synthesis (public: guests can use TTS too) */
    speak: publicProcedure
      .input(z.object({
        text: z.string().min(1).max(5000),
        voice: z.string().default("en-US-GuyNeural"),
        rate: z.string().default("+0%"),
        pitch: z.string().default("+0Hz"),
      }))
      .mutation(async ({ input }) => {
        try {
          const { generateSpeech } = await import("../edgeTTS");
          const audioBuffer = await generateSpeech(
            input.text,
            input.voice,
            input.rate,
            input.pitch,
          );
          return {
            audio: audioBuffer.toString("base64"),
            mimeType: "audio/mpeg",
            voice: input.voice,
          };
        } catch (err: any) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Speech generation failed. Falling back to browser TTS.",
          });
        }
      }),

    /** List available Edge TTS voices with metadata (public) */
    voices: publicProcedure.query(async () => {
      const { getVoiceCatalog } = await import("../edgeTTS");
      return getVoiceCatalog();
    }),

    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string().min(1),
        language: z.string().optional(),
        prompt: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { transcribeAudio } = await import("../_core/voiceTranscription");
        
        // Retry logic: transcription can fail transiently (S3 propagation, network)
        let lastError: any = null;
        for (let attempt = 0; attempt < 2; attempt++) {
          if (attempt > 0) {
            // Brief delay before retry to allow S3 URL propagation
            await new Promise(r => setTimeout(r, 1000));
          }
          const result = await transcribeAudio({
            audioUrl: input.audioUrl,
            language: input.language,
            prompt: input.prompt,
          });
          if ("error" in result) {
            lastError = result;
            // Only retry on service errors, not format/size errors
            if (result.code === "INVALID_FORMAT" || result.code === "FILE_TOO_LARGE") {
              throw new TRPCError({ code: "BAD_REQUEST", message: `${result.error}${result.details ? ` (${result.details})` : ""}` });
            }
            continue; // Retry on SERVICE_ERROR or TRANSCRIPTION_FAILED
          }
          return { text: result.text, language: result.language };
        }
        // All retries exhausted
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `${lastError?.error || "Transcription failed"}${lastError?.details ? ` (${lastError.details})` : ""}` 
        });
      }),

    /** Synthesize text to speech using Edge TTS */
    synthesize: protectedProcedure
      .input(z.object({
        text: z.string().min(1).max(10000),
        voice: z.string().optional(),
        rate: z.string().optional(),
        pitch: z.string().optional(),
        volume: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { synthesizeSpeech } = await import("../tts");
        const audioBuffer = await synthesizeSpeech({
          text: input.text,
          voice: input.voice,
          rate: input.rate,
          pitch: input.pitch,
          volume: input.volume,
        });
        // Return base64-encoded MP3 audio
        return {
          audio: audioBuffer.toString("base64"),
          mimeType: "audio/mpeg",
          size: audioBuffer.length,
        };
      }),

    /** List available TTS voices, optionally filtered by language */
    listVoices: protectedProcedure
      .input(z.object({
        language: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { getVoicesByLanguage } = await import("../tts");
        return getVoicesByLanguage(input?.language);
      }),

    /** List available TTS languages with voice counts */
    listLanguages: protectedProcedure
      .query(async () => {
        const { getAvailableLanguages } = await import("../tts");
        return getAvailableLanguages();
      }),
  });
