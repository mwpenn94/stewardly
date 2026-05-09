/**
 * AgentChat.tsx — R14.14
 *
 * Conversational ↔ Applet bridge surface. The user can talk OR type; each
 * utterance flows through the AgentBridge, which can decide to:
 *   - reply conversationally (the message appears in the transcript and is
 *     spoken via TTS)
 *   - embed an applet inline so the user can work in it without leaving chat
 *   - navigate elsewhere
 *   - generate study material on the fly
 *
 * Route: /agent-chat
 */
import { useEffect, useRef, useState } from "react";
import { useAgentBridge } from "@/contexts/AgentBridgeContext";
import { InlineApplet, HubItemEmbed, listAppletIds } from "@/components/InlineAppletRegistry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mic, Send, Sparkles, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Turn {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export default function AgentChat() {
  const { runUtterance, busy, inlineApplet, setInlineApplet, activeApplet } = useAgentBridge();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, inlineApplet]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setTurns((t) => [...t, { role: "user", content: text, ts: Date.now() }]);
    setInput("");
    const narration = await runUtterance(text);
    if (narration) {
      setTurns((t) => [...t, { role: "assistant", content: narration, ts: Date.now() }]);
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input not supported here"); return; }
    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = async (e: any) => {
      const finals = Array.from(e.results)
        .filter((res: any) => res.isFinal)
        .map((res: any) => res[0]?.transcript ?? "")
        .join(" ").trim();
      if (finals) await send(finals);
    };
    r.onerror = () => setListening(false);
    r.onend = () => { if (recognitionRef.current === r && listening) try { r.start(); } catch {} };
    recognitionRef.current = r;
    setListening(true);
    try { r.start(); } catch {}
  };
  const stopListening = () => {
    setListening(false);
    try { recognitionRef.current?.stop?.(); } catch {}
    recognitionRef.current = null;
  };

  return (
    <>
      <div className="container py-6 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,520px)] gap-4 h-[calc(100vh-7rem)]">
        {/* Conversation column */}
        <div className="flex flex-col rounded-xl border border-border/60 bg-background/60 backdrop-blur-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-sm font-semibold">Agent Chat</h1>
            {activeApplet && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                context: {activeApplet.id}
              </span>
            )}
          </div>

          <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {turns.length === 0 && (
              <Card className="border-dashed text-xs text-muted-foreground p-4">
                Try things like "open the calculator", "summarize this page",
                "regenerate my flashcards", or "go to my content". You can
                also use voice from the mic button or the floating mic on any
                page.
              </Card>
            )}
            {turns.map((t, i) => (
              <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm
                  ${t.role === "user"
                    ? "bg-primary/15 text-foreground border border-primary/30"
                    : "bg-secondary/50 text-foreground border border-border/40"}`}>
                  {t.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="bg-secondary/50 border border-border/40 rounded-xl px-3 py-2 text-xs flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> thinking…
                </div>
              </div>
            )}
          </div>

          <form
            className="border-t border-border/50 p-2 flex items-center gap-2"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <Button
              type="button"
              size="icon"
              variant={listening ? "destructive" : "outline"}
              onClick={listening ? stopListening : startListening}
              aria-label={listening ? "Stop listening" : "Start listening"}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Listening… or type" : "Type or click the mic"}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={!input.trim() || busy}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>

        {/* Inline applet column */}
        <div className="rounded-xl border border-border/60 bg-background/60 backdrop-blur-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Workspace</h2>
            {inlineApplet && (
              <Button size="sm" variant="ghost" onClick={() => setInlineApplet(null)}>
                <X className="w-3 h-3 mr-1" /> Close
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {inlineApplet ? (
              typeof inlineApplet === "string"
                ? <InlineApplet id={inlineApplet} />
                : <HubItemEmbed itemId={inlineApplet.hubItemId} />
            ) : (
              <div className="text-xs text-muted-foreground space-y-3">
                <p>
                  Ask the agent to open any of these inline so you can work in
                  them without leaving the conversation:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {listAppletIds().map((id) => (
                    <button
                      key={id}
                      onClick={() => setInlineApplet(id)}
                      className="px-2 py-0.5 text-[10px] rounded-full border border-border/50 bg-card/40 hover:bg-primary/10 hover:border-primary/40 transition-colors"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
