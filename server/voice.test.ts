/**
 * voice.test.ts
 *
 * Locks in the contract that fixed the iOS-Safari "Invalid file format"
 * Whisper failure:
 *
 *   1. The CLIENT (ManusNextChat VoiceOrb) MUST pick a MediaRecorder MIME
 *      using MediaRecorder.isTypeSupported, fall back to audio/mp4 (.m4a)
 *      when audio/webm isn't available (iOS), and POST RAW BYTES (not
 *      FormData) so the server stores actual audio.
 *
 *   2. The SERVER /api/voice/transcribe handler MUST honor a ?ext= query
 *      param naming a Whisper-supported extension, and MUST store the
 *      uploaded bytes with the right file extension before calling
 *      transcribeAudio.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "/home/ubuntu/stewardly-v3";

describe("voice transcribe contract", () => {
  const client = readFileSync(
    join(ROOT, "client/src/components/ManusNextChat.tsx"),
    "utf8",
  );
  const server = readFileSync(
    join(ROOT, "server/_core/index.ts"),
    "utf8",
  );

  it("client probes MediaRecorder.isTypeSupported", () => {
    expect(client).toMatch(/MediaRecorder\.isTypeSupported/);
  });

  it("client lists audio/mp4 as a fallback for iOS Safari", () => {
    expect(client).toMatch(/audio\/mp4/);
    expect(client).toMatch(/m4a/);
  });

  it("client lists audio/webm with opus as the preferred candidate", () => {
    expect(client).toMatch(/audio\/webm;codecs=opus/);
  });

  it("client posts the RAW blob (not FormData) so server stores audio bytes", () => {
    // The fixed call site uses `body: blob` and `Content-Type: chosenMime`.
    // It must NOT use FormData for the voice route (would cause Whisper to
    // see multipart boundaries and reject as Invalid file format).
    expect(client).toMatch(/body:\s*blob/);
    expect(client).toMatch(/"Content-Type":\s*chosenMime/);
    // The transcribe POST should NOT use FormData on this code path:
    expect(client).not.toMatch(/new FormData\(\)[\s\S]{0,400}\/api\/voice\/transcribe/);
  });

  it("client sends ?ext=<extension> as a Whisper hint", () => {
    expect(client).toMatch(/\/api\/voice\/transcribe\?ext=\$\{chosenExt\}/);
  });

  it("server allow-list matches Whisper's documented supported extensions", () => {
    for (const ext of ["flac", "m4a", "mp3", "mp4", "mpeg", "mpga", "oga", "ogg", "wav", "webm"]) {
      expect(server).toMatch(new RegExp(`"${ext}"`));
    }
  });

  it("server prefers ?ext query param over Content-Type sniffing", () => {
    expect(server).toMatch(/req\.query\?\.ext/);
    expect(server).toMatch(/allowedExts\.has\(queryExt\)/);
  });
});
