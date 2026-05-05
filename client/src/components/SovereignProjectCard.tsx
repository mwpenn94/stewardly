/**
 * SovereignProjectCard — Manus-style project card
 * 
 * Matches Manus's card pattern exactly:
 * - Live preview thumbnail (iframe) at top
 * - Project name + green status dot + domain URL
 * - Two bottom action buttons: "Dashboard" and "Preview"
 * - Three-dot menu for additional actions
 */
import { useState, useRef, useEffect } from "react";
import { Globe, MoreHorizontal, ExternalLink, Code, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SovereignProjectCardProps {
  projectName: string;
  domain: string | null;
  previewUrl: string | null;
  publishedUrl: string | null;
  status: "live" | "building" | "idle" | "error";
  lastUpdated?: string | null;
  onPreview: () => void;
  onDashboard: () => void;
  onPublish: () => void;
  onOpenEditor?: () => void;
  onRefresh?: () => void;
}

export function SovereignProjectCard({
  projectName,
  domain,
  previewUrl,
  publishedUrl,
  status,
  lastUpdated,
  onPreview,
  onDashboard,
  onPublish,
  onOpenEditor,
  onRefresh,
}: SovereignProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const iframeUrl = publishedUrl || previewUrl;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const statusColor = {
    live: "bg-green-400",
    building: "bg-amber-400 animate-pulse",
    idle: "bg-muted-foreground/40",
    error: "bg-red-400",
  }[status];

  const statusLabel = {
    live: "Live",
    building: "Building...",
    idle: "Not deployed",
    error: "Error",
  }[status];

  return (
    <div className="w-full rounded-2xl border border-border bg-card overflow-hidden shadow-lg shadow-black/10">
      {/* Preview Thumbnail */}
      <div className="relative w-full aspect-[16/9] bg-muted/30 overflow-hidden">
        {iframeUrl ? (
          <>
            <iframe
              src={iframeUrl}
              className={cn(
                "w-full h-full border-0 pointer-events-none transition-opacity duration-500",
                iframeLoaded ? "opacity-100" : "opacity-0"
              )}
              sandbox="allow-scripts allow-same-origin"
              loading="lazy"
              onLoad={() => setIframeLoaded(true)}
              title="Site preview"
            />
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Globe className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground/50">No preview available</p>
          </div>
        )}

        {/* Subtle gradient overlay at bottom for readability */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
      </div>

      {/* Project Info */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {/* App icon */}
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Globe className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground truncate">{projectName}</h3>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn("w-2 h-2 rounded-full shrink-0", statusColor)} />
                {domain ? (
                  <a
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary truncate transition-colors"
                  >
                    {lastUpdated ? `${lastUpdated} • ` : ""}{domain}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">{statusLabel}</span>
                )}
              </div>
            </div>
          </div>

          {/* Three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-border bg-popover shadow-xl shadow-black/20 py-1.5 animate-in fade-in-0 zoom-in-95">
                {onOpenEditor && (
                  <button
                    onClick={() => { onOpenEditor(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    <Code className="w-3.5 h-3.5" />
                    Open in Editor
                  </button>
                )}
                {onRefresh && (
                  <button
                    onClick={() => { onRefresh(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Preview
                  </button>
                )}
                <button
                  onClick={() => { onPublish(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Publish Now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Action Buttons — Matching Manus exactly */}
      <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-2.5">
        <button
          onClick={onDashboard}
          className="py-2.5 rounded-xl text-sm font-semibold bg-muted/80 text-foreground hover:bg-muted transition-colors border border-border"
        >
          Dashboard
        </button>
        <button
          onClick={onPreview}
          className="py-2.5 rounded-xl text-sm font-semibold bg-card text-foreground hover:bg-accent transition-colors border border-border"
        >
          Preview
        </button>
      </div>
    </div>
  );
}
