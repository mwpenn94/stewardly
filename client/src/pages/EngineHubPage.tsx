/**
 * EngineHubPage — generic landing page for any of the five engines.
 *
 * Renders a glass-card hero with the engine label + tagline, then a
 * responsive grid of role-gated nested children (leaves and mission
 * specializations). Driven entirely by shared/engineTaxonomy.ts so a
 * change to the taxonomy reflects everywhere.
 */
import { useMemo } from "react";
import { useRoles } from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// (Card primitives are still used by the loading + restricted states below.)
import GlassCard from "@/components/glass/GlassCard";
import SortableLeafGrid from "@/components/glass/SortableLeafGrid";
import { cn } from "@/lib/utils";
import {
  ENGINES,
  visibleEnginesFor,
  previewEnginesFor,
  type EngineDef,
  type Role,
} from "@shared/engineTaxonomy";

interface EngineHubPageProps {
  engineId: EngineDef["id"];
}

function rolesToTaxonomyRole(flags: ReturnType<typeof useRoles>): Role {
  if (flags.canSeePlatform || flags.canSeeAdminConsole) return "admin";
  if (flags.canSeeOrgAdmin || flags.canSeeManager) return "manager";
  if (flags.canSeeProfessional) return "advisor";
  return "user";
}

export default function EngineHubPage({ engineId }: EngineHubPageProps) {
  const flags = useRoles();
  const definition = useMemo(() => ENGINES.find((e) => e.id === engineId), [engineId]);

  if (flags.isLoading) {
    return (
      <div className="container py-8 marble-bg">
        <div className="h-8 w-64 rounded-md bg-card animate-pulse mb-2" />
        <div className="h-5 w-96 rounded-md bg-card animate-pulse mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="container py-8 marble-bg">
        <p className="text-muted-foreground">Engine not found.</p>
      </div>
    );
  }

  const role = rolesToTaxonomyRole(flags);
  // Unauthenticated visitors get the full preview (every leaf at
  // disclosure 4); authenticated visitors get role-gated leaves.
  // The roles.me query errors for unauthed visitors and resolves to
  // null roles, so detect that explicitly instead of falling back to
  // the default "user" role (which only surfaces 2-3 leaves).
  const isUnauthed = !flags.isLoading && flags.roles === null;
  const visible = isUnauthed
    ? previewEnginesFor(4).find((e) => e.id === engineId)
    : visibleEnginesFor(role, 4).find((e) => e.id === engineId);

  if (!visible) {
    return (
      <div
        data-testid={`engine-${engineId}-restricted`}
        className="container py-8 marble-bg"
      >
        <Card className="glass-card max-w-xl">
          <CardHeader>
            <CardTitle>Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This engine surface is restricted at your current role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const EngineIcon = visible.icon;

  return (
    // Outer scroll container — fixes the long-standing "engine pages
    // do not scroll" bug. <main> in AppLayout uses overflow-hidden so we
    // need a true scroll wrapper here, not just bottom padding.
    <div
      data-testid={`engine-${engineId}-hub`}
      data-engine-scroll-container="true"
      className="h-full overflow-y-auto overscroll-contain marble-bg"
    >
      <div className="container py-8 pb-32">
        {/* Glass hero — iOS-26 frosted card with engine icon, label, tagline */}
        <GlassCard intensity="vivid" className="mb-8 px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/10 dark:bg-white/5 p-2.5 ring-1 ring-white/15">
              <EngineIcon className={cn("w-6 h-6", visible.color)} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{visible.label}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{visible.tagline}</p>
            </div>
          </div>
        </GlassCard>

        {(visible.leaves?.length ?? 0) > 0 && (
          <section className="mb-8">
            <SortableLeafGrid
              engineId={String(engineId)}
              leaves={visible.leaves!}
              persist={!isUnauthed}
            />
          </section>
        )}

        {(visible.missions?.length ?? 0) > 0 &&
          visible.missions!.map((mission) => {
            const MissionIcon = mission.icon;
            return (
              <section key={mission.slug} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <MissionIcon className="w-4 h-4 text-foreground/70" />
                  <h2 className="text-base font-medium tracking-tight">{mission.label}</h2>
                </div>
                <SortableLeafGrid
                  engineId={`${String(engineId)}.${mission.slug}`}
                  leaves={mission.leaves}
                  persist={!isUnauthed}
                />
              </section>
            );
          })}
      </div>
    </div>
  );
}
