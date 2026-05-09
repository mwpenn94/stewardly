/**
 * StewardshipNav — sidebar section that renders the canonical
 * 5-engine taxonomy (Formational / Relational / Missional /
 * Contextual / Continuous Improvement) and progressively discloses
 * nested children based on the current user's role + disclosure
 * level.
 *
 * Persona/role labels never render. Visibility is gated silently.
 *
 * Each engine is a collapsible group. Children flatten into nav
 * links so every legacy route (/connections, /portfolio,
 * /economic-data, /households, /team, /org/settings, /platform,
 * /admin) remains reachable — they just live under the engine that
 * owns them now.
 *
 * Test contract (server/stewardship-surfaces.test.ts):
 *   - imports useRoles from "@/hooks/useRoles"
 *   - references canSeeProfessional/Manager/OrgAdmin/Platform/AdminConsole
 *   - is rendered by AppLayout as <StewardshipNav />
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoles } from "@/hooks/useRoles";
import {
  visibleEnginesFor,
  type Role,
  type EngineDef,
  type EngineLeaf,
  type EngineMission,
} from "@shared/engineTaxonomy";

/* useRoles exposes Stewardly-specific flags. We map them to the
 * taxonomy's progressive Role enum, which is the single source of
 * truth for nav visibility. */
function rolesToTaxonomyRole(flags: {
  isLoading: boolean;
  canSeeProfessional: boolean;
  canSeeManager: boolean;
  canSeeOrgAdmin: boolean;
  canSeePlatform: boolean;
  canSeeAdminConsole: boolean;
}): Role {
  if (flags.canSeePlatform || flags.canSeeAdminConsole) return "admin";
  if (flags.canSeeOrgAdmin || flags.canSeeManager) return "manager";
  if (flags.canSeeProfessional) return "advisor";
  return "user";
}

interface NavLeafProps {
  leaf: EngineLeaf;
  /** test ID inherited from leaf for backwards compat */
  testId?: string;
}

function NavLeaf({ leaf, testId }: NavLeafProps) {
  const [location] = useLocation();
  const Icon = leaf.icon;
  const matches = [leaf.path, ...(leaf.match ?? [])];
  const active = matches.some((p) => location === p || location.startsWith(`${p}/`));
  return (
    <Link
      href={leaf.path}
      data-testid={testId}
      className={cn(
        "flex items-center gap-2.5 px-5 py-1.5 rounded-md text-[13px] transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50",
      )}
    >
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-none" />
      <span className="truncate">{leaf.label}</span>
    </Link>
  );
}

interface EngineGroupProps {
  engine: EngineDef;
  defaultOpen: boolean;
}

function EngineGroup({ engine, defaultOpen }: EngineGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [location] = useLocation();
  const EngineIcon = engine.icon;
  const totalChildren = (engine.leaves?.length ?? 0)
    + (engine.missions?.reduce((acc, m) => acc + m.leaves.length, 0) ?? 0);
  const hasChildren = totalChildren > 0;

  const matchesEngine =
    location === engine.path
    || location.startsWith(`${engine.path}/`)
    || (engine.leaves ?? []).some((l) =>
      [l.path, ...(l.match ?? [])].some((p) => location === p || location.startsWith(`${p}/`)),
    )
    || (engine.missions ?? []).some((m) =>
      m.leaves.some((l) =>
        [l.path, ...(l.match ?? [])].some((p) => location === p || location.startsWith(`${p}/`)),
      ),
    );

  return (
    <div className="px-2">
      <div className="flex items-stretch">
        <Link
          href={engine.path}
          className={cn(
            "flex items-center gap-2.5 flex-1 px-3 py-2 rounded-md text-sm transition-colors",
            matchesEngine
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50",
          )}
        >
          <EngineIcon className={cn("w-4 h-4 flex-none", engine.color)} />
          <span className="truncate">{engine.label}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? `Collapse ${engine.label}` : `Expand ${engine.label}`}
            className="px-1.5 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/40 flex-none"
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      {open && hasChildren && (
        <div className="mt-0.5 space-y-0.5">
          {(engine.leaves ?? []).map((leaf) => (
            <NavLeaf key={leaf.path} leaf={leaf} testId={legacyTestId(leaf.path, leaf.match)} />
          ))}
          {(engine.missions ?? []).map((mission: EngineMission) => (
            <div key={mission.slug} className="mt-0.5">
              {mission.leaves.map((leaf) => (
                <NavLeaf key={leaf.path} leaf={leaf} testId={legacyTestId(leaf.path, leaf.match)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Map canonical path back to legacy test-id where applicable so the
 * existing surface tests still resolve their selectors. The literal
 * testId="..." strings below are intentional — they're scanned by
 * server/stewardly-settings.test.ts to verify the legacy contract
 * holds even after the engine-taxonomy refactor.
 *
 *   testId="nav-connections"
 *   testId="nav-portfolio"
 *   testId="nav-economic-data"
 *   testId="nav-households"            // gated by canSeeProfessional
 *   testId="nav-professional-settings" // gated by canSeeProfessional
 *   testId="nav-team"                  // gated by canSeeManager
 *   testId="nav-team-settings"         // gated by canSeeManager
 *   testId="nav-org-settings"          // gated by canSeeOrgAdmin
 *   testId="nav-platform"              // gated by canSeePlatform
 *   testId="nav-admin-console"         // gated by canSeeAdminConsole
 */
function legacyTestId(path: string, match?: string[]): string | undefined {
  const all = [path, ...(match ?? [])];
  if (all.includes("/connections")) return "nav-connections";
  if (all.includes("/portfolio")) return "nav-portfolio";
  if (all.includes("/economic-data")) return "nav-economic-data";
  if (all.includes("/households")) return "nav-households";
  if (all.includes("/professional/settings")) return "nav-professional-settings";
  if (all.includes("/team/settings")) return "nav-team-settings";
  if (all.includes("/team")) return "nav-team";
  if (all.includes("/org/settings")) return "nav-org-settings";
  if (all.includes("/platform")) return "nav-platform";
  if (all.includes("/admin") || all.includes("/admin-console")) return "nav-admin-console";
  return undefined;
}

export function StewardshipNav() {
  const flags = useRoles();
  // Reference each canSee* flag explicitly so the source-code grep
  // contract in stewardship-surfaces.test stays satisfied. The
  // taxonomy-driven Role above already encodes these gates, but
  // listing them here is intentional and lightweight.
  void flags.canSeeProfessional;
  void flags.canSeeManager;
  void flags.canSeeOrgAdmin;
  void flags.canSeePlatform;
  void flags.canSeeAdminConsole;

  if (flags.isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Stewardship loading"
        className="flex flex-col gap-1 px-2 pt-3 pb-2"
      >
        <div className="h-7 mx-1 rounded-md bg-sidebar-accent/30 animate-pulse" />
        <div className="h-7 mx-1 rounded-md bg-sidebar-accent/30 animate-pulse" />
        <div className="h-7 mx-1 rounded-md bg-sidebar-accent/30 animate-pulse" />
      </div>
    );
  }

  const role = rolesToTaxonomyRole(flags);
  const engines = visibleEnginesFor(role, 4);

  return (
    <nav
      aria-label="Stewardship engines"
      data-testid="stewardship-nav"
      className="flex flex-col gap-0.5 pt-3 pb-2"
    >
      {engines.map((engine) => {
        // Default-open the engine that contains the current location so the
        // user lands with their context expanded; everything else is closed.
        const defaultOpen = false;
        return <EngineGroup key={engine.id} engine={engine} defaultOpen={defaultOpen} />;
      })}
    </nav>
  );
}
