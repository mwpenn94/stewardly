/**
 * tieredVoice.ts — R14.14: simplified to Edge-TTS-only.
 *
 * Per product direction (R14.14), Stewardly uses exactly two TTS paths:
 *   1. Microsoft Edge TTS (server-side, premium neural voices) — this module
 *   2. The user's device speech voice (window.speechSynthesis, client-side)
 *
 * No third-party AI TTS engines (Kokoro, ElevenLabs, OpenAI TTS) are wired.
 * The previous tiered cascade (Edge CLI → Kokoro public API → browser) was
 * dead code (the CLI was never installed) and the Kokoro path made the user
 * believe they had selected a voice they never actually got. This module now
 * just delegates to the working msedge-tts path used by /api/tts.
 */
import { generateSpeech } from "../edgeTTS";
import { storagePut } from "../storage";

export interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
}

export interface TTSResult {
  audioUrl: string | null;
  tier: "edge_tts" | "device";
  quality: "premium" | "device";
  voice?: string;
  warning?: string;
  /** When the caller can't reach Edge TTS, the client should speak the text via window.speechSynthesis. */
  clientSideFallback?: { text: string; voice?: string; rate?: number };
}

/** Curated subset of Edge TTS voices for callers that just want a name. */
export const EDGE_TTS_VOICES = {
  english: [
    { id: "en-US-AriaNeural", name: "Aria (US Female)", gender: "female" },
    { id: "en-US-GuyNeural", name: "Guy (US Male)", gender: "male" },
    { id: "en-US-JennyNeural", name: "Jenny (US Female)", gender: "female" },
    { id: "en-GB-SoniaNeural", name: "Sonia (UK Female)", gender: "female" },
    { id: "en-GB-RyanNeural", name: "Ryan (UK Male)", gender: "male" },
    { id: "en-AU-NatashaNeural", name: "Natasha (AU Female)", gender: "female" },
  ],
  multilingual: [],
};

/**
 * Generate speech using Edge-TTS. Returns an S3-hosted MP3 URL.
 * If Edge-TTS fails, the result will instruct the client to fall back to
 * window.speechSynthesis (the user's device voice) — never Kokoro/ElevenLabs/etc.
 */
export async function generateSpeechTiered(request: TTSRequest): Promise<TTSResult> {
  const { text, voice, speed } = request;
  try {
    const ratePercent = speed ? Math.round((speed - 1) * 100) : 0;
    const rateString = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
    const buffer = await generateSpeech(text, voice ?? "aria", rateString, "+0Hz");
    const filename = `tts/${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
    const { url } = await storagePut(filename, buffer, "audio/mpeg");
    return {
      audioUrl: url,
      tier: "edge_tts",
      quality: "premium",
      voice: voice ?? "aria",
    };
  } catch (err: any) {
    return {
      audioUrl: null,
      tier: "device",
      quality: "device",
      warning: `Edge TTS unreachable (${err?.message ?? "unknown"}); use device voice.`,
      clientSideFallback: { text, voice, rate: speed ?? 1.0 },
    };
  }
}

export function getAvailableVoices(): typeof EDGE_TTS_VOICES {
  return EDGE_TTS_VOICES;
}
