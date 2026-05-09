/**
 * GlobalVoiceFAB.tsx — R14.14
 *
 * App-wide hands-free voice control. The button has two presses:
 *
 *   • Tap once  → start an in-page voice loop. Recognition runs on the
 *                 current page; each finalized utterance is sent to the
 *                 AgentBridge, which decides what to do (navigate, edit,
 *                 generate, summarize, …) and narrates the result via TTS.
 *                 The user never has to navigate to /chat to use voice.
 *
 *   • Tap again → stop the loop. (Or it auto-stops on errors after retries.)
 *
 *   • Long-press / right-click → open the conversational chat surface
 *                                instead, for users who prefer the full
 *                                chat UI.
 *
 * The FAB is hidden on /chat, where the ChatInputBar already owns the loop.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AudioLines, Mic, MicOff, Loader2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAgentBridge } from "@/contexts/AgentBridgeContext";
import { toast } from "sonner";

// SpeechRecognition is browser-prefixed.
const getRecognition = (): any | null => {
  if (typeof window === "undefined") return null;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = true;
  r.interimResults = false;
  r.lang = "en-US";
  return r;
};

export function GlobalVoiceFAB() {
  const [location, navigate] = useLocation();
  const { runUtterance, busy, activeApplet, voiceState } = useAgentBridge();
  const [listening, setListening] = useState(false);
  const listeningRef = useRef(false);
  const recognitionRef = useRef<any | null>(null);

  // R14.24 — keep a ref in sync so the SpeechRecognition.onend closure can
  // see the *current* listening state without stale-capture bugs.
  useEffect(() => { listeningRef.current = listening; }, [listening]);

  const stop = useCallback(() => {
    setListening(false);
    listeningRef.current = false;
    try { recognitionRef.current?.stop?.(); } catch { /* ignore */ }
    recognitionRef.current = null;
  }, []);

  const start = useCallback(() => {
    const r = getRecognition();
    if (!r) {
      toast.error("Voice input isn't available in this browser. Try Chrome.");
      navigate("/agent-chat"); // graceful fallback
      return;
    }
    recognitionRef.current = r;
    setListening(true);

    r.onresult = async (event: any) => {
      const results = Array.from(event.results) as any[];
      const finals = results.filter((res: any) => res.isFinal).map((res: any) => res[0]?.transcript ?? "").join(" ").trim();
      if (!finals) return;
      // Pause recognition while the agent is acting; resume after.
      try { r.stop?.(); } catch { /* ignore */ }
      try { await runUtterance(finals); } catch { /* runUtterance already shows errors */ }
      // Resume listening for the next utterance.
      try { r.start?.(); } catch { /* ignore — fresh instance below */ }
    };
    r.onerror = (e: any) => {
      console.warn("[GlobalVoiceFAB] recognition error", e?.error);
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        toast.error("Microphone permission denied.");
        stop();
      }
    };
    r.onend = () => {
      // Browser auto-ends after silence; restart while user is still in voice mode.
      // R14.24 — read the live ref, not the stale closure value.
      if (recognitionRef.current === r && listeningRef.current) {
        try { r.start?.(); } catch { /* ignore */ }
      }
    };
    try { r.start(); } catch { /* ignore (already started) */ }
  }, [runUtterance, navigate, stop, listening]);

  // Keep listening flag in sync with ref lifecycle.
  useEffect(() => () => stop(), [stop]);

  // R14.38: Hide ONLY on chat/task surfaces where their own input owns the
  // mic. The Home page's input mic is single-shot dictation; the global FAB
  // exposes continuous hands-free mode and MUST remain visible on Home.
  if (
    location.startsWith("/chat") ||
    location.startsWith("/agent-chat") ||
    location.startsWith("/task/")
  ) return null;

  const handleClick = () => {
    if (listening) {
      stop();
      toast.info("Voice paused");
    } else {
      start();
      toast.info(activeApplet
        ? `Listening on ${activeApplet.id} — say what you want to do`
        : "Listening — try \"summarize this page\" or \"open my content\"");
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/agent-chat");
  };

  // R14.24 — surface 4-state visual: idle / listening / thinking / speaking.
  const Icon = busy || voiceState === "thinking" ? Loader2 : voiceState === "speaking" ? AudioLines : listening ? Mic : AudioLines;
  const isThinking = busy || voiceState === "thinking";
  const isSpeaking = voiceState === "speaking";

  // Anchor above the mobile bottom tab bar (h-14 = 56px), opposite side
  // from the floating + (which sits at bottom-20 right-4). On md+ screens
  // there's no tab bar, so a slightly lower anchor still feels right.
  return (
    <div
      className="fixed left-4 z-40 md:bottom-6 md:left-6"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            className={`
              group relative flex items-center justify-center
              w-12 h-12 rounded-full shadow-lg
              transition-all duration-300 ease-out
              hover:scale-110 hover:shadow-xl
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
              backdrop-blur-md border
              ${isSpeaking
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                : isThinking
                  ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
                  : listening
                    ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                    : "bg-primary/10 text-primary hover:bg-primary/20 border-primary/30"}
            `}
            aria-label={listening ? "Stop hands-free voice" : "Start hands-free voice"}
            aria-pressed={listening}
          >
            <Icon className={`w-5 h-5 ${isThinking ? "animate-spin" : ""}`} />
            {!listening && !busy && (
              <span className="absolute -top-1 -right-1 text-[9px] font-mono bg-muted text-muted-foreground rounded px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ⇧V
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {isSpeaking
            ? "Speaking…"
            : isThinking
              ? "Thinking…"
              : listening
                ? "Listening… click to stop · right-click for chat"
                : "Hold-to-talk · right-click for chat"}
        </TooltipContent>
      </Tooltip>
      {/* Status caption — gives non-visual confirmation of mode */}
      {(listening || isThinking || isSpeaking) && (
        <p className="absolute left-14 bottom-2 text-[10px] uppercase tracking-wider whitespace-nowrap text-muted-foreground bg-background/70 backdrop-blur px-2 py-0.5 rounded-full border border-border/40">
          {isSpeaking ? "Speaking" : isThinking ? "Thinking…" : "Listening"}
        </p>
      )}
    </div>
  );
}
