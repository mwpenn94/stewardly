/**
 * Voice orb + /api/voice/transcribe wiring contract.
 *
 * The mic button in ManusNextChat is supposed to:
 *   1. Toggle MediaRecorder capture on click.
 *   2. POST the captured blob to /api/voice/transcribe.
 *   3. Stuff the returned `text` back into the input field.
 *   4. Visualize idle / listening / processing via the imported VoiceOrb.
 *
 * This spec locks each of those source-level contracts so the wiring
 * cannot silently regress (e.g. someone reverting to the old
 * "voice unavailable" placeholder).
 *
 * The /api/voice/transcribe Express route is verified by source pattern
 * (auth gate, storagePut import, transcribeAudio import, JSON response
 * shape) rather than a live HTTP call, since the storage + Whisper
 * helpers require live platform credentials that aren't available in
 * the unit-test environment.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("Voice orb wiring in ManusNextChat", () => {
  const src = read("client/src/components/ManusNextChat.tsx");

  it("imports VoiceOrb from the glass component bundle", () => {
    expect(src).toMatch(
      /import\s*\{\s*VoiceOrb\s*\}\s*from\s*"@\/components\/glass\/VoiceOrb"/,
    );
  });

  it("declares a voiceState state machine with all four canonical states", () => {
    expect(src).toContain('"idle" | "listening" | "processing" | "speaking"');
  });

  it("uses MediaRecorder + getUserMedia to capture audio", () => {
    expect(src).toMatch(/navigator\.mediaDevices\?\.getUserMedia/);
    expect(src).toContain("new MediaRecorder(stream)");
  });

  it("POSTs the captured blob to /api/voice/transcribe", () => {
    expect(src).toContain('"/api/voice/transcribe"');
    expect(src).toMatch(/method:\s*"POST"/);
    expect(src).toMatch(/credentials:\s*"include"/);
  });

  it("renders the orb when state is non-idle and the Mic icon when idle", () => {
    expect(src).toMatch(/<VoiceOrb\s+state=\{voiceState\}/);
    expect(src).toMatch(
      /voiceState === "idle"\s*\?\s*\(\s*<Mic[\s\S]*?\)\s*:\s*\(\s*<VoiceOrb/,
    );
  });

  it("does not retain the legacy 'voice unavailable' placeholder", () => {
    // The pre-port wiring threw a hard error on Mic click. That contract
    // is gone; if it ever returns the test should fail loudly.
    expect(src).not.toMatch(/Voice input requires microphone permission/);
  });
});

describe("/api/voice/transcribe Express route", () => {
  const src = read("server/_core/index.ts");

  it("registers the route as a POST handler", () => {
    expect(src).toMatch(/app\.post\("\/api\/voice\/transcribe"/);
  });

  it("authenticates the request before doing any work", () => {
    // Source pattern ensures the auth check still gates the route. If
    // someone removes the user check we want the test to flag it,
    // because Whisper costs money per call.
    const idx = src.indexOf('"/api/voice/transcribe"');
    expect(idx).toBeGreaterThan(0);
    const block = src.slice(idx, idx + 2500);
    expect(block).toContain("authenticateRequest(req)");
    expect(block).toContain('return res\n          .status(401)');
  });

  it("uploads the audio bytes to storage before calling Whisper", () => {
    const idx = src.indexOf('"/api/voice/transcribe"');
    const block = src.slice(idx, idx + 2500);
    expect(block).toContain('storagePut(');
    expect(block).toContain('transcribeAudio({ audioUrl: url })');
  });

  it("returns text + language + segments in the response", () => {
    const idx = src.indexOf('"/api/voice/transcribe"');
    const block = src.slice(idx, idx + 2500);
    expect(block).toContain("text: result.text");
    expect(block).toContain("language: result.language");
    expect(block).toContain("segments: result.segments");
  });

  it("rejects audio over 16MB with a 413", () => {
    const idx = src.indexOf('"/api/voice/transcribe"');
    const block = src.slice(idx, idx + 2500);
    expect(block).toContain("16 * 1024 * 1024");
    expect(block).toMatch(/\.status\(413\)/);
  });
});
