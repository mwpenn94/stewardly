/**
 * InstalledAppsList — renders the "Installed" subgroup inside the Apps drawer.
 *
 * Calls `trpc.apps.listInstalled` (protected) and renders one nav-link per
 * installed app. Apps the user owns are flagged. Clicking an app navigates
 * to its detail/launch route at /apps/{slug}.
 *
 * Renders nothing while loading except a quiet skeleton; renders an
 * empty-state hint when the user has zero installed apps so the drawer
 * still tells them what this section is for.
 */
import { useLocation } from "wouter";
import { Box } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Props {
  /** Used by parent to close the mobile drawer after a tap. */
  onNavigate?: () => void;
}

export function InstalledAppsList({ onNavigate }: Props) {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.apps.listInstalled.useQuery(undefined, {
    // Sidebar query — keep it cheap; the underlying joins are small.
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="px-2 py-1.5 text-xs text-muted-foreground/60">
        Loading apps…
      </div>
    );
  }

  const apps = data ?? [];

  if (apps.length === 0) {
    return (
      <div className="px-2 py-1.5 text-xs text-muted-foreground/60 leading-snug">
        Apps you create or install will appear here. Use the
        <span className="px-1 font-mono">+</span> above to add one.
      </div>
    );
  }

  return (
    <ul className="space-y-0.5">
      {apps.map(({ app, source }) => {
        const Icon = Box;
        const isOwned = source === "created";
        return (
          <li key={app.id}>
            <button
              type="button"
              onClick={() => {
                setLocation(`/apps/${app.slug}`);
                onNavigate?.();
              }}
              className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
              title={app.description ?? app.name}
            >
              <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{app.name}</span>
              {isOwned && (
                <span
                  className="text-[9px] uppercase tracking-wider text-muted-foreground/60"
                  title="You own this app"
                >
                  Mine
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
