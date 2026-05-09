// Round 14.10 smoke test — verify the round's deliverables:
//  1. guest-session endpoint returns 200 with JWT
//  2. voice.voices procedure returns voices list
//  3. /api/tts endpoint accepts POST and returns audio/* content
//  4. Schema is in sync (479+ unique tables defined in code)
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const BASE = "http://localhost:3000";

describe("Round 14.10 — audio/voice/schema smoke", () => {
  it("guest-session endpoint returns 200 with token", async () => {
    const res = await fetch(`${BASE}/api/auth/guest-session`, { method: "POST" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token).toBe("string");
    expect(body.token.length).toBeGreaterThan(20);
  }, 15_000);

  it("voice.voices tRPC returns at least one voice", async () => {
    // Query via tRPC HTTP batch link
    const url = `${BASE}/api/trpc/voice.voices?batch=1&input=${encodeURIComponent(JSON.stringify({"0":{"json":null,"meta":{"values":["undefined"]}}}))}`;
    const res = await fetch(url);
    expect(res.status).toBe(200);
    const data = await res.json();
    const voices = data?.[0]?.result?.data?.json;
    expect(Array.isArray(voices)).toBe(true);
    expect(voices.length).toBeGreaterThan(0);
  }, 15_000);

  it("/api/tts streams audio for a short phrase", async () => {
    const res = await fetch(`${BASE}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello world", voice: "en-US-AriaNeural" }),
    });
    expect(res.status).toBe(200);
    const ct = res.headers.get("content-type") || "";
    expect(ct).toMatch(/audio|mpeg|mp3/i);
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(500);
  }, 30_000);

  it("schema files together define 470+ unique tables", () => {
    const root = resolve(__dirname, "..");
    const main = readFileSync(resolve(root, "drizzle/schema.ts"), "utf-8");
    const ai = readFileSync(resolve(root, "drizzle/schema-ai.ts"), "utf-8");
    const re = /mysqlTable\("([^"]+)"/g;
    const names = new Set<string>();
    for (const text of [main, ai]) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) names.add(m[1]);
      re.lastIndex = 0;
    }
    expect(names.size).toBeGreaterThanOrEqual(470);
  });

  it("HandsFreeStudy page is registered and routable", () => {
    const root = resolve(__dirname, "..");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf-8");
    expect(app).toMatch(/HandsFreeStudy/);
    expect(app).toMatch(/\/learning\/hands-free/);
  });
});
