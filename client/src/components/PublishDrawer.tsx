/**
 * PublishDrawer — Manus-style bottom sheet for publish progress
 * 
 * Uses the vaul-based Drawer primitive for consistent UX.
 * Shows real-time build progress stages with streaming log.
 */
import { useState, useEffect, useRef } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export type PublishStage = "idle" | "committing" | "pushing" | "building" | "deploying" | "live" | "error";

interface PublishDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: PublishStage;
  buildLog: string[];
  publishedUrl: string | null;
  error: string | null;
  onRetry: () => void;
  onOpenSite: () => void;
}

const STAGES: { key: PublishStage; label: string }[] = [
  { key: "committing", label: "Committing changes" },
  { key: "pushing", label: "Pushing to GitHub" },
  { key: "building", label: "Building project" },
  { key: "deploying", label: "Deploying to edge" },
  { key: "live", label: "Live!" },
];

function getStageIndex(stage: PublishStage): number {
  const idx = STAGES.findIndex((s) => s.key === stage);
  return idx >= 0 ? idx : -1;
}

export function PublishDrawer({
  open,
  onOpenChange,
  stage,
  buildLog,
  publishedUrl,
  error,
  onRetry,
  onOpenSite,
}: PublishDrawerProps) {
  const [showLog, setShowLog] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const currentStageIdx = getStageIndex(stage);
  const isComplete = stage === "live";
  const isError = stage === "error";

  // Auto-scroll log
  useEffect(() => {
    if (showLog && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [buildLog, showLog]);

  // Reset log visibility on new publish
  useEffect(() => {
    if (stage === "committing") {
      setShowLog(false);
    }
  }, [stage]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-base" style={{ fontFamily: "var(--font-heading)" }}>
            {isComplete ? "Published!" : isError ? "Publish Failed" : "Publishing..."}
          </DrawerTitle>
          <DrawerDescription>
            {isComplete && publishedUrl
              ? publishedUrl.replace(/^https?:\/\//, "").split("/")[0]
              : isError
                ? "Something went wrong during deployment"
                : "This usually takes about 60 seconds"
            }
          </DrawerDescription>
        </DrawerHeader>

        {/* Progress Stages */}
        <div className="px-5 pb-4">
          <div className="space-y-2.5">
            {STAGES.map((s, i) => {
              const isDone = currentStageIdx > i || isComplete;
              const isCurrent = currentStageIdx === i && !isComplete && !isError;
              const isFailed = isError && currentStageIdx === i;

              return (
                <div key={s.key} className="flex items-center gap-3">
                  {/* Status icon */}
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : isFailed ? (
                      <XCircle className="w-4 h-4 text-red-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
                    )}
                  </div>

                  {/* Label */}
                  <span className={cn(
                    "text-sm transition-colors",
                    isDone ? "text-green-400 font-medium" :
                    isCurrent ? "text-foreground font-medium" :
                    isFailed ? "text-red-400 font-medium" :
                    "text-muted-foreground"
                  )}>
                    {s.label}
                  </span>

                  {/* Progress indicator for current stage */}
                  {isCurrent && (
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden ml-2">
                      <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {isError && error && (
          <div className="mx-5 mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-xs text-red-400 font-mono">{error}</p>
          </div>
        )}

        {/* Build Log Toggle */}
        {buildLog.length > 0 && (
          <div className="px-5 pb-2">
            <button
              onClick={() => setShowLog(!showLog)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showLog ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              {showLog ? "Hide" : "Show"} build log ({buildLog.length} lines)
            </button>
          </div>
        )}

        {/* Build Log */}
        {showLog && buildLog.length > 0 && (
          <div className="mx-5 mb-4 max-h-40 overflow-y-auto rounded-xl bg-background border border-border p-3 font-mono text-[11px] leading-relaxed">
            {buildLog.map((line, i) => (
              <div key={i} className={cn(
                "text-muted-foreground",
                line.includes("ERROR") && "text-red-400",
                line.includes("complete") && "text-green-400"
              )}>
                {line}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        )}

        {/* Action Footer */}
        <DrawerFooter>
          {isComplete && (
            <Button onClick={onOpenSite} className="w-full gap-2">
              <ExternalLink className="w-4 h-4" />
              Open Site
            </Button>
          )}
          {isError && (
            <Button onClick={onRetry} className="w-full gap-2">
              <RotateCcw className="w-4 h-4" />
              Retry Publish
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
