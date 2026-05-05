/**
 * Tiered Voice Services
 * 
 * TTS Quality-first degradation:
 *   Tier 0 (Free Premium): Edge TTS (Microsoft neural voices, free, unlimited, 400+ voices)
 *   Tier 1 (Free High): Kokoro TTS via API (open-source neural TTS)
 *   Tier 2 (Standard): Browser SpeechSynthesis (client-side, basic quality)
 *   Tier U (Upgrades): ElevenLabs, OpenAI TTS
 * 
 * STT Quality-first degradation:
 *   Tier 0 (Built-in): Forge Whisper API (platform-provided)
 *   Tier 1 (Free): Browser SpeechRecognition API (client-side, real-time)
 *   Tier U (Upgrades): Deepgram, AssemblyAI
 */

export interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
}

export interface TTSResult {
  audioUrl: string | null;
  tier: "edge_tts" | "kokoro" | "browser" | "text_only";
  quality: "premium" | "high" | "standard" | "degraded";
  voice?: string;
  warning?: string;
  /** If browser-side TTS is needed, return the text for client to speak */
  clientSideFallback?: { text: string; voice?: string; rate?: number };
}

/**
 * Available Edge TTS voices (most popular, high quality neural voices).
 * Full list: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support
 */
export const EDGE_TTS_VOICES = {
  english: [
    { id: "en-US-AriaNeural", name: "Aria (US Female)", gender: "female" },
    { id: "en-US-GuyNeural", name: "Guy (US Male)", gender: "male" },
    { id: "en-US-JennyNeural", name: "Jenny (US Female)", gender: "female" },
    { id: "en-US-DavisNeural", name: "Davis (US Male)", gender: "male" },
    { id: "en-GB-SoniaNeural", name: "Sonia (UK Female)", gender: "female" },
    { id: "en-GB-RyanNeural", name: "Ryan (UK Male)", gender: "male" },
    { id: "en-AU-NatashaNeural", name: "Natasha (AU Female)", gender: "female" },
  ],
  multilingual: [
    { id: "es-ES-ElviraNeural", name: "Elvira (Spanish)", gender: "female" },
    { id: "fr-FR-DeniseNeural", name: "Denise (French)", gender: "female" },
    { id: "de-DE-KatjaNeural", name: "Katja (German)", gender: "female" },
    { id: "ja-JP-NanamiNeural", name: "Nanami (Japanese)", gender: "female" },
    { id: "zh-CN-XiaoxiaoNeural", name: "Xiaoxiao (Chinese)", gender: "female" },
    { id: "pt-BR-FranciscaNeural", name: "Francisca (Portuguese)", gender: "female" },
    { id: "hi-IN-SwaraNeural", name: "Swara (Hindi)", gender: "female" },
  ],
};

/**
 * Generate speech using the tiered cascade.
 * Edge TTS is the primary (free, unlimited, premium quality).
 */
export async function generateSpeechTiered(request: TTSRequest): Promise<TTSResult> {
  const { text, voice, language, speed } = request;

  // ── Tier 0: Edge TTS (Free Premium — Microsoft Neural Voices) ──
  try {
    const audioUrl = await edgeTTSGenerate(text, voice || "en-US-AriaNeural", speed);
    if (audioUrl) {
      return {
        audioUrl,
        tier: "edge_tts",
        quality: "premium",
        voice: voice || "en-US-AriaNeural",
      };
    }
  } catch (err: any) {
    console.warn(`[tieredVoice] Edge TTS failed: ${err.message}`);
  }

  // ── Tier 1: Kokoro TTS (Free, Open-Source Neural) ──
  try {
    const audioUrl = await kokoroTTSGenerate(text, voice);
    if (audioUrl) {
      return {
        audioUrl,
        tier: "kokoro",
        quality: "high",
        warning: "Using Kokoro open-source TTS. Upgrade to ElevenLabs for premium voice quality.",
      };
    }
  } catch (err: any) {
    console.warn(`[tieredVoice] Kokoro TTS failed: ${err.message}`);
  }

  // ── Tier 2: Browser SpeechSynthesis (Client-side fallback) ──
  return {
    audioUrl: null,
    tier: "browser",
    quality: "standard",
    warning: "Using browser speech synthesis (client-side). Quality varies by browser.",
    clientSideFallback: {
      text,
      voice: voice || undefined,
      rate: speed || 1.0,
    },
  };
}

/**
 * Edge TTS — Free, unlimited, premium quality neural voices.
 * Uses the edge-tts npm package or direct WebSocket API.
 * 
 * For server-side, we use the REST endpoint that edge-tts exposes.
 * The audio is generated and stored temporarily.
 */
async function edgeTTSGenerate(text: string, voice: string, speed?: number): Promise<string | null> {
  try {
    // Use the edge-tts-like API via a free public endpoint
    // Alternative: install edge-tts package and run locally
    const rate = speed ? `${speed > 1 ? "+" : ""}${Math.round((speed - 1) * 100)}%` : "+0%";
    
    // Try using the Forge built-in TTS if available
    const { storagePut } = await import("../storage");
    
    // Generate via edge-tts command-line tool (installed as Python package)
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    const crypto = await import("crypto");
    
    const filename = `tts-${crypto.randomUUID()}.mp3`;
    const outputPath = `/tmp/${filename}`;
    
    // Escape text for shell
    const escapedText = text.replace(/'/g, "'\\''").slice(0, 5000); // Limit to 5000 chars
    
    await execAsync(
      `edge-tts --voice "${voice}" --rate="${rate}" --text '${escapedText}' --write-media "${outputPath}"`,
      { timeout: 30000 }
    );
    
    // Upload to S3
    const fs = await import("fs");
    const audioBuffer = fs.readFileSync(outputPath);
    const { url } = await storagePut(`tts/${filename}`, audioBuffer, "audio/mpeg");
    
    // Clean up temp file
    fs.unlinkSync(outputPath);
    
    return url;
  } catch (err: any) {
    console.warn(`[tieredVoice] Edge TTS generation failed: ${err.message}`);
    return null;
  }
}

/**
 * Kokoro TTS — Open-source neural TTS.
 * Uses the free Kokoro API endpoint if available.
 */
async function kokoroTTSGenerate(text: string, voice?: string): Promise<string | null> {
  try {
    // Kokoro has a public demo API at huggingface spaces
    const resp = await fetch("https://hexgrad-kokoro-tts.hf.space/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [text.slice(0, 2000), voice || "af_heart", 1.0],
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    
    // Kokoro returns audio as base64 or URL
    if (data?.data?.[0]?.url) {
      return data.data[0].url;
    }
    
    return null;
  } catch (err: any) {
    console.warn(`[tieredVoice] Kokoro TTS failed: ${err.message}`);
    return null;
  }
}

/**
 * Get available voices for the current tier.
 */
export function getAvailableVoices(): typeof EDGE_TTS_VOICES {
  return EDGE_TTS_VOICES;
}
