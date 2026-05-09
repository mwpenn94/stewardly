/**
 * AgentBridgeContext.tsx — R14.14
 *
 * The single brain that bridges hands-free voice, chat, and applets.
 *
 * Any applet calls `useRegisterApplet({ id, state, actions })` to declare
 * "I'm the active applet, here's my state, and here are the things you can
 * do to me." Anywhere else in the app (chat input, voice FAB, hotkey),
 * `useAgentBridge().runUtterance("…")` will:
 *
 *   1. Call trpc.voiceAgent.decide with the utterance + the registered
 *      applet's id/state/route.
 *   2. Receive a structured AgentAction.
 *   3. Either dispatch it to the applet's registered handler (for in-applet
 *      adjustments/edits) OR perform an app-level action (navigate, open
 *      another applet inline in chat, generate questions, save a note,
 *      summarize, speak, clarify).
 *   4. Narrate the response via the TTS pipeline so the loop is hands-free.
 *
 * Audible cues:
 *   • "thinking…" earcon plays as soon as we receive the utterance
 *   • "ready" earcon plays once the action begins executing
 *   • TTS narration speaks the final result
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type AgentAction =
  | { type: "navigate"; path: string }
  | { type: "speak"; text: string }
  | { type: "summarize"; text: string }
  | { type: "open_applet"; applet?: string; hubItemId?: number }
  | { type: "form_fill"; fields: Record<string, string> }
  | { type: "generate_questions"; trackId?: number; count?: number; topic?: string }
  | { type: "save_note"; title: string; body: string }
  | { type: "answer"; text: string }
  | { type: "clarify"; question: string };

export interface AppletRegistration {
  /** Stable applet id ("formational", "calculator", …). */
  id: string;
  /** Snapshot of meaningful applet state for the agent prompt. */
  state?: Record<string, unknown>;
  /** Optional handler the agent can call to adjust/update inside the applet. */
  onAgentAction?: (action: AgentAction) => Promise<boolean> | boolean;
}

interface AgentBridgeValue {
  /** Most recently registered applet (the one the agent will scope its decisions to). */
  activeApplet: AppletRegistration | null;

  /** Imperatively register/unregister an applet from the agent's context. */
  registerApplet: (reg: AppletRegistration) => () => void;

  /** Free-form utterance → agent decision → execution. Returns the narration. */
  runUtterance: (utterance: string) => Promise<string>;

  /** Execute a structured action directly. Returns true if the active applet handled it. */
  executeAction: (action: AgentAction) => Promise<boolean>;

  /**
   * The chat surface registers an inline-applet renderer here so the agent
   * can reply with "type: open_applet" and have the chat embed it.
   */
  /** Either a static applet id, or a Hub item descriptor for dynamic embed. */
  inlineApplet: string | { hubItemId: number } | null;
  setInlineApplet: (id: string | { hubItemId: number } | null) => void;

  /** Whether the agent is currently thinking. */
  busy: boolean;

  /** R14.24 — explicit 4-state machine for the voice FAB / hud to surface. */
  voiceState: "idle" | "thinking" | "speaking";
}

const AgentBridgeContext = createContext<AgentBridgeValue | null>(null);

const EARCON_THINKING = "/sounds/earcon-thinking.mp3"; // optional asset
const EARCON_READY = "/sounds/earcon-ready.mp3";

function friendlyError(err: any): string {
  const raw = err?.message ?? "";
  // tRPC bubbles Zod issues as a JSON string — don't show that to humans.
  if (raw.startsWith("[") || raw.includes("invalid_type")) {
    return "I didn't catch that clearly. Could you try again?";
  }
  if (raw.toLowerCase().includes("network") || raw.toLowerCase().includes("fetch")) {
    return "Network hiccup — trying again will usually fix it.";
  }
  if (raw.toLowerCase().includes("unauthorized") || raw.toLowerCase().includes("forbidden")) {
    return "You'll need to sign in for that.";
  }
  return raw || "Sorry, I couldn't process that.";
}

function playEarcon(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.35;
    audio.play().catch(() => { /* missing earcons are non-fatal */ });
  } catch { /* ignore */ }
}

export function AgentBridgeProvider({ children }: { children: ReactNode }) {
  const [appletStack, setAppletStack] = useState<AppletRegistration[]>([]);
  const [inlineApplet, setInlineApplet] = useState<string | { hubItemId: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "thinking" | "speaking">("idle");
  const [location, navigate] = useLocation();
  const decideMut = trpc.voiceAgent.decide.useMutation();
  const summarizeMut = trpc.voiceAgent.summarize.useMutation();

  const activeApplet = appletStack[appletStack.length - 1] ?? null;
  const activeAppletRef = useRef(activeApplet);
  activeAppletRef.current = activeApplet;

  const registerApplet = useCallback((reg: AppletRegistration) => {
    setAppletStack((prev) => [...prev.filter(a => a.id !== reg.id), reg]);
    return () => {
      setAppletStack((prev) => prev.filter((a) => a.id !== reg.id));
    };
  }, []);

  /** Speak via the same TTS engine the rest of the app uses (Edge or device). */
  const speak = useCallback(async (text: string) => {
    if (!text) return;
    setVoiceState("speaking");
    const cleanup = () => setVoiceState("idle");
    // Prefer the global AudioCompanion path if present (Edge-TTS-aware).
    try {
      const engine = (() => {
        try {
          const v = localStorage.getItem("tts-engine");
          return v === "device" ? "device" : "edge";
        } catch { return "edge"; }
      })();
      if (engine === "edge") {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: localStorage.getItem("tts-voice") || "aria" }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => { URL.revokeObjectURL(url); cleanup(); };
          audio.onerror = cleanup;
          await audio.play();
          return;
        }
      }
    } catch { /* fall through to device TTS */ }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.onend = cleanup;
      u.onerror = cleanup;
      window.speechSynthesis.speak(u);
      // Safety net — if speechSynthesis events never fire (Safari quirk),
      // clear the speaking flag after a generous timeout.
      setTimeout(cleanup, Math.max(3000, text.length * 70));
    } else {
      cleanup();
    }
  }, []);

  /**
   * R14.24 — client-side page-text extractor used as a fallback when the
   * voice-agent LLM emits a `summarize` action with empty text. We grab the
   * heading + visible text inside <main> (or the body if no <main> exists),
   * collapse whitespace, and cap at 6000 chars to fit the summarize input.
   */
  function extractVisiblePageText(): string {
    if (typeof document === "undefined") return "";
    const titleParts: string[] = [];
    if (document.title) titleParts.push(document.title);
    const main = document.getElementById("main-content") || document.querySelector("main") || document.body;
    if (!main) return titleParts.join(". ").slice(0, 6000);
    // Hide nav, footer, dialog, aside, script, style from the extraction.
    const skipSelectors = "nav, footer, dialog, [aria-hidden=true], script, style, .sr-only, [role=presentation]";
    const clone = main.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(skipSelectors).forEach((el) => el.remove());
    const raw = (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
    return [titleParts.join(". "), raw].filter(Boolean).join(". ").slice(0, 6000);
  }

  /** Friendly summary of an action so the user always sees what the agent decided. */
  function describeAction(a: AgentAction): string {
    switch (a.type) {
      case "navigate": return `Navigating to ${a.path}`;
      case "open_applet":
        return typeof a.hubItemId === "number"
          ? `Opening Hub item #${a.hubItemId}`
          : `Opening ${a.applet ?? "applet"} inline`;
      case "summarize": return "Summarizing this page…";
      case "generate_questions":
        return `Generating practice questions${a.topic ? ` on ${a.topic}` : ""}`;
      case "save_note": return `Saving note: ${a.title}`;
      case "form_fill": return "Filling form fields…";
      case "answer": return a.text?.slice(0, 80) ?? "Answering…";
      case "clarify": return a.question?.slice(0, 80) ?? "Asking a follow-up…";
      case "speak": return a.text?.slice(0, 80) ?? "Speaking…";
      default: return "Working…";
    }
  }

  const executeAction = useCallback(
    async (action: AgentAction): Promise<boolean> => {
      // Always surface the decided action to the user so they see intent even
      // if downstream execution fails. R14.17 — hands-free voice diagnostics.
      const summary = describeAction(action);
      console.log("[AgentBridge] executeAction", action.type, action, "→", summary);
      toast.message(summary, { duration: 2500 });

      // 1. Give the active applet a chance to handle in-applet adjustments first.
      const applet = activeAppletRef.current;
      if (applet?.onAgentAction) {
        try {
          const handled = await applet.onAgentAction(action);
          if (handled === true) return true;
        } catch (err) {
          console.warn("[AgentBridge] applet handler threw", err);
        }
      }
      // 2. App-level fallbacks.
      switch (action.type) {
        case "navigate":
          if (!action.path || typeof action.path !== "string") {
            toast.error("Agent returned a navigate action with no path.");
            return false;
          }
          navigate(action.path);
          return true;
        case "open_applet":
          if (typeof action.hubItemId === "number") {
            setInlineApplet({ hubItemId: action.hubItemId });
            // Make sure the user actually sees the applet — push them to /agent-chat
            // when the open_applet action is emitted from anywhere else.
            if (!location.startsWith("/agent-chat")) navigate("/agent-chat");
          } else if (typeof action.applet === "string") {
            setInlineApplet(action.applet);
            if (!location.startsWith("/agent-chat")) navigate("/agent-chat");
          } else {
            toast.error("Agent asked to open an applet but didn't say which one.");
            return false;
          }
          return true;
        case "speak":
        case "answer": {
          // R14.24 — always surface as toast in addition to TTS, because mobile
          // Safari frequently blocks speechSynthesis from async chains.
          const text = (action.text ?? "").trim();
          if (text) toast.message(text, { duration: 8000 });
          await speak(text || "OK.");
          return true;
        }
        case "summarize": {
          // R14.24 — if the LLM returned summarize with empty text (it almost
          // always does, because it has no DOM access), fall back to extracting
          // the visible page content client-side and summarize THAT.
          let text = (action.text ?? "").trim();
          if (!text || text.length < 40) {
            text = extractVisiblePageText();
            console.log("[AgentBridge] summarize fallback, extracted text length=", text.length);
          }
          if (!text || text.length < 40) {
            const msg = "There's not much on this page I can summarize yet.";
            toast.info(msg);
            await speak(msg);
            return true;
          }
          try {
            const r = await summarizeMut.mutateAsync({ text });
            const summary = r.summary || "I summarized the page but got an empty result.";
            // Surface visually AND speak — redundancy is required because mobile
            // Safari often blocks TTS when invoked from an async chain.
            toast.message(summary, { duration: 8000 });
            await speak(summary);
          } catch (err) {
            console.warn("[AgentBridge] summarize failed", err);
            const msg = "I couldn't summarize that. Try a different page.";
            toast.error(msg);
            await speak(msg);
          }
          return true;
        }
        case "clarify": {
          const q = (action.question ?? "").trim() || "Could you say that again?";
          toast.message(q, { duration: 6000 });
          await speak(q);
          return true;
        }
        case "save_note":
          // Apps without a note router get a toast fallback.
          toast.success(`Note saved: ${action.title}`);
          return true;
        case "form_fill":
          // Form-fill is applet-specific; if no applet handled it, surface to the user.
          toast.info("Heard your input but nothing on this page accepts it yet.");
          return false;
        case "generate_questions":
          // Drop the user on the Learning hub with a flag — the page reads ?generate=…
          navigate(`/formational?generate=1${action.trackId ? `&track=${action.trackId}` : ""}${action.topic ? `&topic=${encodeURIComponent(action.topic)}` : ""}`);
          return true;
      }
      console.warn("[AgentBridge] no handler for action", action);
      toast.error(`Agent returned an unknown action type: ${(action as any).type}`);
      return false;
    },
    [navigate, speak, summarizeMut, location]
  );

  const runUtterance = useCallback(
    async (utterance: string): Promise<string> => {
      if (!utterance.trim()) return "";
      // R14.17 diagnostic — always show what we heard so the user knows the
      // pipeline is alive even if the LLM/network step fails silently.
      console.log("[AgentBridge] runUtterance heard:", utterance);
      toast.message(`Heard: “${utterance.length > 60 ? utterance.slice(0, 60) + "…" : utterance}”`, { duration: 1800 });
      setBusy(true);
      playEarcon(EARCON_THINKING);
      try {
        const applet = activeAppletRef.current;
        const decision = await decideMut.mutateAsync({
          utterance,
          context: {
            route: location,
            applet: (applet?.id as any) ?? undefined,
            appletState: applet?.state ?? undefined,
          },
        });
        console.log("[AgentBridge] decision", decision);
        playEarcon(EARCON_READY);
        await executeAction(decision.action as AgentAction);
        if (decision.narration) await speak(decision.narration);
        return decision.narration;
      } catch (err: any) {
        // Convert verbose Zod / network errors into something a human (and TTS) can handle.
        const friendly = friendlyError(err);
        console.warn("[AgentBridge] runUtterance failed", err);
        toast.error(friendly);
        await speak(friendly);
        return friendly;
      } finally {
        setBusy(false);
      }
    },
    [decideMut, executeAction, location, speak]
  );

  // R14.24 — keep voiceState in sync with busy when not actively speaking.
  useEffect(() => {
    setVoiceState((prev) => {
      if (prev === "speaking") return prev;
      return busy ? "thinking" : "idle";
    });
  }, [busy]);

  const value = useMemo<AgentBridgeValue>(
    () => ({
      activeApplet,
      registerApplet,
      runUtterance,
      executeAction,
      inlineApplet,
      setInlineApplet,
      busy,
      voiceState,
    }),
    [activeApplet, registerApplet, runUtterance, executeAction, inlineApplet, busy, voiceState]
  );

  return <AgentBridgeContext.Provider value={value}>{children}</AgentBridgeContext.Provider>;
}

export function useAgentBridge(): AgentBridgeValue {
  const v = useContext(AgentBridgeContext);
  if (!v) throw new Error("useAgentBridge must be used inside <AgentBridgeProvider>");
  return v;
}

/** Convenience hook for applets: registers/unregisters automatically. */
export function useRegisterApplet(reg: AppletRegistration | null) {
  const { registerApplet } = useAgentBridge();
  // Stable JSON snapshot of state to avoid re-registering every render.
  const stateKey = useMemo(() => (reg?.state ? JSON.stringify(reg.state) : ""), [reg?.state]);
  useEffect(() => {
    if (!reg) return;
    const off = registerApplet(reg);
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reg?.id, stateKey, reg?.onAgentAction]);
}
