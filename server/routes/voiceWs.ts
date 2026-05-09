/**
 * /api/voice/ws — WebSocket streaming voice transcription
 *
 * Two modes based on env:
 *  - Deepgram mode (when DEEPGRAM_API_KEY is set): proxies to Deepgram realtime API
 *  - Stub mode (when DEEPGRAM_API_KEY is missing): accepts audio, returns a
 *    {ready: false, reason: 'missing-deepgram-key'} message and closes cleanly
 *
 * The stub mode is intentional so VoiceOrb can probe the endpoint at runtime
 * and gracefully fall back to the REST `voice.transcribe` mutation.
 */
import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

const VOICE_WS_PATH = "/api/voice/ws";

export function attachVoiceWs(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    if (req.url !== VOICE_WS_PATH) return;
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    const dgKey = process.env.DEEPGRAM_API_KEY;

    if (!dgKey) {
      ws.send(
        JSON.stringify({
          ready: false,
          reason: "missing-deepgram-key",
          message:
            "Voice WS endpoint is mounted but DEEPGRAM_API_KEY is not set. Add it via Settings → Secrets, then reconnect.",
        })
      );
      ws.close(1011, "deepgram-key-missing");
      return;
    }

    // Deepgram mode: open an upstream WebSocket to Deepgram realtime
    // We do this lazily-loaded so the server doesn't fail to boot if @deepgram/sdk isn't installed.
    let upstream: WebSocket | null = null;
    (async () => {
      try {
        const url =
          "wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true";
        upstream = new WebSocket(url, {
          headers: { Authorization: `Token ${dgKey}` },
        });
        upstream.on("message", (data) => {
          if (ws.readyState === ws.OPEN) ws.send(data.toString());
        });
        upstream.on("close", () => ws.close(1000, "upstream-closed"));
        upstream.on("error", (err) => {
          ws.send(
            JSON.stringify({
              error: "deepgram-upstream-error",
              detail: String(err),
            })
          );
          ws.close(1011, "upstream-error");
        });
      } catch (err) {
        ws.send(
          JSON.stringify({
            error: "deepgram-connect-failed",
            detail: String(err),
          })
        );
        ws.close(1011, "connect-failed");
      }
    })();

    ws.on("message", (chunk) => {
      if (upstream && upstream.readyState === upstream.OPEN) {
        upstream.send(chunk as Buffer);
      }
    });
    ws.on("close", () => {
      if (upstream) upstream.close();
    });
  });

  console.log(`[voice-ws] WebSocket endpoint mounted at ${VOICE_WS_PATH}`);
}
