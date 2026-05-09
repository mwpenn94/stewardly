/**
 * StewardshipPageShell — consistent page chrome for the 5-layer surfaces.
 * Renders an h1 + optional layer-tag + description + body inside a marble
 * background. Pages mount their content as children.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const LAYER_BADGES: Record<string, { label: string; tone: string }> = {
  L5: { label: "L5 · User",         tone: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30" },
  L4: { label: "L4 · Professional", tone: "bg-sky-500/10     text-sky-400     ring-sky-500/30" },
  L3: { label: "L3 · Manager",      tone: "bg-violet-500/10  text-violet-400  ring-violet-500/30" },
  L2: { label: "L2 · Organization", tone: "bg-amber-500/10   text-amber-400   ring-amber-500/30" },
  L1: { label: "L1 · Platform",     tone: "bg-rose-500/10    text-rose-400    ring-rose-500/30" },
  ADMIN: { label: "Admin Console",  tone: "bg-red-500/10     text-red-400     ring-red-500/30" },
};

interface StewardshipPageShellProps {
  layer?: keyof typeof LAYER_BADGES;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StewardshipPageShell({
  layer,
  title,
  description,
  actions,
  children,
  className,
}: StewardshipPageShellProps) {
  const badge = layer ? LAYER_BADGES[layer] : null;

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <header
        className="glass-sidebar shrink-0 px-6 py-4 flex items-start justify-between gap-4"
        data-testid="stewardship-page-header"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {badge && (
              <span
                className={cn(
                  "inline-flex items-center text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full ring-1",
                  badge.tone,
                )}
                data-testid="stewardship-page-layer"
              >
                {badge.label}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </header>
      <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
    </div>
  );
}
