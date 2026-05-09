/**
 * /hub — iOS-Home-Screen-style organizing surface.
 *
 * The Hub collapsed Library + Apps + Engines into a single grid where every
 * tile is one of:
 *   • app      → engine app, user-published app, or installed share-link app
 *   • artifact → saved chat / generated content
 *   • file     → uploaded file blob
 *   • folder   → opens a sub-grid of items
 *
 * The page supports:
 *   • Multi-page swipe (◀ ▶ + page dots)
 *   • A "dock" at the bottom holding pinned items across all pages
 *   • Search / sort / filter chips above the grid
 *   • A persistent "+" floating button opening Create/Import/Publish/Share
 *
 * Permissions cascade through the canonical 5-layer stack:
 *   private → org (with optional minRole) → unlisted (token) → public.
 */
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { Link } from "wouter";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LayoutGrid,
  Search as SearchIcon,
  Plus,
  FolderPlus,
  Upload,
  AppWindow,
  Sparkles,
  Globe,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  ArrowDownAZ,
  Clock,
  Shapes,
  Users,
  Lock,
  Building2,
  Eye,
  Share2,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types mirroring server BUILTIN_ENGINE_APPS shape ───────────────────────
type BuiltinTile = {
  id: number;
  builtinId: string;
  itemType: "app";
  label: string;
  icon: string;
  color: string;
  path: string;
  pageIndex: number;
  sortOrder: number;
  visibility: "private";
  pinnedToDock: 0 | 1;
};

type HubTile = {
  id: number;
  itemType: "app" | "artifact" | "file" | "folder";
  label: string;
  icon: string | null;
  color: string | null;
  appId: number | null;
  builtinId: string | null;
  parentFolderId: number | null;
  pageIndex: number;
  sortOrder: number;
  pinnedToDock: number;
  visibility: "private" | "org" | "unlisted" | "public";
  organizationId: number | null;
  minRole: "user" | "professional" | "manager" | "org_admin" | null;
  ownerUserId: number;
  payload: unknown;
  lastOpenedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AnyTile =
  | { kind: "builtin"; data: BuiltinTile }
  | { kind: "hub"; data: HubTile };

type SortMode = "manual" | "recents" | "name" | "type" | "owner";
type FilterMode = "all" | "app" | "artifact" | "file" | "folder";

const PAGE_SIZE = 24; // 6 cols × 4 rows on desktop

// iOS-springboard tile chrome.
// Container is OPAQUE bg-card with a subtle border so labels are always
// legible against the page background in BOTH themes. Color is expressed
// only as an icon-chip background + a thin top accent.
const COLOR_CHIP: Record<string, string> = {
  emerald: "bg-emerald-500 text-white",
  rose: "bg-rose-500 text-white",
  blue: "bg-blue-500 text-white",
  amber: "bg-amber-500 text-white",
  purple: "bg-purple-500 text-white",
  slate: "bg-slate-500 text-white",
};

function colorClasses(color: string | null | undefined): string {
  // Tile container chrome is theme-neutral; legibility-first.
  return "bg-card text-card-foreground border border-border shadow-sm hover:shadow-md";
}

function chipClasses(color: string | null | undefined): string {
  if (!color) return COLOR_CHIP.slate;
  return COLOR_CHIP[color] ?? COLOR_CHIP.slate;
}

function visibilityBadge(v: HubTile["visibility"]) {
  switch (v) {
    case "private":
      return { label: "Private", icon: Lock, klass: "text-muted-foreground" };
    case "org":
      return { label: "Org", icon: Building2, klass: "text-blue-300" };
    case "unlisted":
      return { label: "Unlisted", icon: LinkIcon, klass: "text-amber-300" };
    case "public":
      return { label: "Public", icon: Globe, klass: "text-emerald-300" };
  }
}

export default function HubPage() {
  const [location, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Query string is Wouter-agnostic; parse manually
  const params = useMemo(() => new URLSearchParams(window.location.search), [location]);
  const initialAction = params.get("action");
  const installToken = params.get("install");
  const initialTab = params.get("tab") === "catalog" ? "catalog" : "grid";

  const [tab, setTab] = useState<"grid" | "catalog">(initialTab);
  const [pageIndex, setPageIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("manual");
  const [filter, setFilter] = useState<FilterMode>("all");

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createKind, setCreateKind] = useState<
    null | "app" | "file" | "artifact" | "folder"
  >(null);
  const [shareItem, setShareItem] = useState<HubTile | null>(null);
  const [publishItem, setPublishItem] = useState<HubTile | null>(null);

  // Auto-open create dialog from query string
  useEffect(() => {
    if (initialAction === "new-app") {
      setCreateOpen(true);
      setCreateKind("app");
    } else if (initialAction === "import-file") {
      setCreateOpen(true);
      setCreateKind("file");
    } else if (initialAction === "new-artifact") {
      setCreateOpen(true);
      setCreateKind("artifact");
    } else if (initialAction === "new-folder") {
      setCreateOpen(true);
      setCreateKind("folder");
    }
  }, [initialAction]);

  // Fetch hub items for the current user (with role-aware permission cascade).
  // R14.33: Always run BOTH queries so we have a guaranteed builtins fallback
  // even when the authed `hub.list` errors (Safari mobile network blip, server
  // 5xx, role-cascade failure, etc.). The Hub must NEVER render blank engine
  // tiles — the 5 builtins are part of the app's identity.
  const { user: authUser } = useAuth();
  const authedQuery = trpc.hub.list.useQuery(
    { parentFolderId: null, sort, itemType: filter === "all" ? undefined : filter },
    { enabled: !!authUser, retry: 1 },
  );
  // R14.33: publicQuery is now ALWAYS enabled so the engine tiles render even
  // if the authed query fails. The endpoint is cheap (returns the static 5
  // BUILTIN_ENGINE_APPS) and unauthenticated.
  const publicQuery = trpc.hub.listPublic.useQuery(undefined, {
    staleTime: 60_000,
  });
  // R14.33: prefer authed data when available, but cascade to public data when
  // authed errors or hasn't returned yet. The end result: builtins always
  // present, items only present when authed query succeeded.
  const data = useMemo(() => {
    const base = publicQuery.data ?? { items: [] as any[], builtins: [] as any[] };
    if (authUser && authedQuery.data) {
      return {
        items: authedQuery.data.items as any[],
        builtins:
          authedQuery.data.builtins.length > 0
            ? (authedQuery.data.builtins as any[])
            : (base.builtins as any[]),
      };
    }
    return base;
  }, [authUser, authedQuery.data, publicQuery.data]);
  // Only show loading skeleton when BOTH queries are still in-flight — once
  // publicQuery resolves we have at least the 5 engine tiles to display.
  const isLoading = publicQuery.isLoading && (authUser ? authedQuery.isLoading : true);

  const installMutation = trpc.hub.installFromShareLink.useMutation({
    onSuccess: () => {
      toast.success("Installed to your Hub");
      void utils.hub.list.invalidate();
      // Strip ?install= from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("install");
      window.history.replaceState({}, "", url.toString());
    },
    onError: (e) => toast.error(e.message),
  });

  // Auto-install if a share token came in via URL
  useEffect(() => {
    if (installToken) {
      installMutation.mutate({ token: installToken });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installToken]);

  // Round 8 fix: builtin tile order is persisted client-side per user (localStorage)
  // since builtins aren't DB rows the hub.move mutation can address.
  const builtinOrderKey = `stewardly:hubBuiltinOrder:${authUser?.id ?? "guest"}`;
  const [builtinOrder, setBuiltinOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(builtinOrderKey);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { window.localStorage.setItem(builtinOrderKey, JSON.stringify(builtinOrder)); } catch { /* quota */ }
  }, [builtinOrder, builtinOrderKey]);

  // ── Derive tiles for current page (search/filter applied client-side too)
  const all: AnyTile[] = useMemo(() => {
    if (!data) return [];
    const tiles: AnyTile[] = [];
    // Sort builtins by saved order (unknown ids fall to the end in their original order).
    const orderedBuiltins = [...data.builtins].sort((a, b) => {
      const ai = builtinOrder.indexOf(a.id); const bi = builtinOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    for (const b of orderedBuiltins) {
      if (filter !== "all" && filter !== "app") continue;
      if (query && !b.label.toLowerCase().includes(query.toLowerCase())) continue;
      tiles.push({ kind: "builtin", data: b as BuiltinTile });
    }
    for (const it of data.items as HubTile[]) {
      if (query && !it.label.toLowerCase().includes(query.toLowerCase())) continue;
      tiles.push({ kind: "hub", data: it });
    }
    return tiles;
  }, [data, query, filter, builtinOrder]);

  // Split into root-level tiles vs dock-pinned
  const dockTiles = useMemo(
    () => all.filter((t) => t.kind === "hub" && t.data.pinnedToDock === 1),
    [all],
  );
  const gridTiles = useMemo(
    () => all.filter((t) => !(t.kind === "hub" && t.data.pinnedToDock === 1)),
    [all],
  );

  const totalPages = Math.max(1, Math.ceil(gridTiles.length / PAGE_SIZE));
  const pageTiles = gridTiles.slice(
    pageIndex * PAGE_SIZE,
    (pageIndex + 1) * PAGE_SIZE,
  );

  // Browse public catalog (when on /hub?tab=catalog)
  const { data: catalog } = trpc.hub.browsePublic.useQuery(
    { query: query || undefined, limit: 60 },
    { enabled: tab === "catalog" },
  );

  // ── Drag-to-reorder + drag-onto-tile-creates-folder ─────────────────
  const moveMut = trpc.hub.move.useMutation({
    onError: (e) => toast.error(e.message),
    onSuccess: () => void utils.hub.list.invalidate(),
  });
  const folderMut = trpc.hub.createFolder.useMutation({
    onError: (e) => toast.error(e.message),
    onSuccess: () => void utils.hub.list.invalidate(),
  });

  function handleReorder(args: {
    activeId: string;
    overId: string;
    dropOnTile: AnyTile | null;
  }) {
    // Both ids look like "hub-12" or "builtin-3"
    const tilesById = new Map(pageTiles.map((t) => [`${t.kind}-${t.data.id}`, t]));
    const active = tilesById.get(args.activeId);
    const over = tilesById.get(args.overId);
    if (!active || !over) return;

    // Folder creation: dropping a hub item ON ANOTHER hub item (not on a folder, not on a builtin) → create folder containing both.
    const droppingOntoOther =
      args.dropOnTile &&
      args.dropOnTile.data.id !== active.data.id &&
      active.kind === "hub" &&
      args.dropOnTile.kind === "hub" &&
      (args.dropOnTile.data as HubTile).itemType !== "folder";
    if (droppingOntoOther && active.kind === "hub" && args.dropOnTile?.kind === "hub") {
      // Create a folder, then move both items into it.
      const a = active.data as HubTile;
      const b = args.dropOnTile.data as HubTile;
      folderMut.mutate(
        { label: "New folder", icon: "📁" },
        {
          onSuccess: (created) => {
            void Promise.all([
              moveMut.mutateAsync({ itemId: a.id, parentFolderId: created.id }),
              moveMut.mutateAsync({ itemId: b.id, parentFolderId: created.id }),
            ]).then(() => void utils.hub.list.invalidate());
          },
        },
      );
      return;
    }

    // Drop ON a folder → move into folder.
    if (
      args.dropOnTile?.kind === "hub" &&
      (args.dropOnTile.data as HubTile).itemType === "folder" &&
      active.kind === "hub"
    ) {
      const a = active.data as HubTile;
      const f = args.dropOnTile.data as HubTile;
      moveMut.mutate({ itemId: a.id, parentFolderId: f.id });
      return;
    }

    // Plain reorder. Compute indices first.
    const oldIndex = pageTiles.findIndex(
      (t) => `${t.kind}-${t.data.id}` === args.activeId,
    );
    const newIndex = pageTiles.findIndex(
      (t) => `${t.kind}-${t.data.id}` === args.overId,
    );
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    // Round 8 fix: if the dragged tile is a builtin, persist new order client-side
    // (builtins aren't DB rows, so we can't call hub.move).
    if (active.kind === "builtin") {
      // Recompute the builtin order across ALL builtins (not just current page).
      const allBuiltinIds = (data?.builtins ?? []).map((b) => b.id);
      const movingId = (active.data as BuiltinTile).id;
      // Determine target: position of overId among builtins
      const overTile = pageTiles[newIndex];
      const overId = overTile?.kind === "builtin" ? (overTile.data as BuiltinTile).id : null;
      const ordered = allBuiltinIds.filter((id) => id !== movingId);
      const insertAt = overId ? ordered.indexOf(overId) : ordered.length;
      ordered.splice(Math.max(0, insertAt), 0, movingId);
      setBuiltinOrder(ordered);
      return;
    }

    // Persist new sortOrder for the moved hub item.
    const a = active.data as HubTile;
    moveMut.mutate({
      itemId: a.id,
      pageIndex,
      sortOrder: newIndex,
    });
  }

  function handleTileClick(tile: AnyTile) {
    if (tile.kind === "builtin") {
      navigate(tile.data.path);
      return;
    }
    const it = tile.data;
    // touch lastOpenedAt
    void utils.client.hub.touch.mutate({ itemId: it.id }).catch(() => {});
    if (it.itemType === "folder") {
      navigate(`/hub/${it.id}`);
    } else if (it.itemType === "app") {
      if (it.builtinId?.startsWith("engine:")) {
        // Look up the canonical path for this builtin engine instead of
        // synthesising one from builtinId — paths are the source of truth
        // (server/routers/hub.ts BUILTIN_ENGINE_APPS).
        const builtin = (data?.builtins ?? []).find(
          (b) => b.builtinId === it.builtinId,
        );
        navigate(builtin?.path ?? `/${it.builtinId.replace("engine:", "").replace("optimal", "continuous-improvement")}`);
      } else if (it.appId) {
        navigate(`/library-classic?app=${it.appId}`);
      }
    } else if (it.itemType === "file") {
      const key = (it.payload as { fileKey?: string } | null)?.fileKey;
      if (key) window.open(`/manus-storage/${key}`, "_blank");
    } else if (it.itemType === "artifact") {
      toast("Artifact preview coming soon");
    }
  }

  return (
    // Round 7 polish: explicit scroll container so Hub never inherits the
    // overflow-hidden trap from AppLayout's <main>.
    <div
      data-testid="hub-page"
      data-hub-scroll-container="true"
      className="h-full overflow-y-auto overscroll-contain pb-20 md:pb-8"
    >
      {/* ─ Header ─ */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="container py-3 flex items-center gap-3">
          <LayoutGrid className="w-5 h-5 text-primary shrink-0" />
          <h1 className="text-lg md:text-xl font-semibold tracking-tight">Hub</h1>
          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground ml-2">
            <span className="px-1.5 py-0.5 rounded bg-muted/50">apps</span>
            <span className="px-1.5 py-0.5 rounded bg-muted/50">artifacts</span>
            <span className="px-1.5 py-0.5 rounded bg-muted/50">files</span>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("grid")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-md border",
                tab === "grid"
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border/40 text-muted-foreground hover:text-foreground",
              )}
            >
              My Hub
            </button>
            <button
              onClick={() => setTab("catalog")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-md border",
                tab === "catalog"
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "border-border/40 text-muted-foreground hover:text-foreground",
              )}
            >
              Catalog
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="container pb-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-md">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              data-testid="hub-search"
              placeholder="Search Hub…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          <Select value={filter} onValueChange={(v) => setFilter(v as FilterMode)}>
            <SelectTrigger className="h-8 w-[120px] text-xs" data-testid="hub-filter">
              <Shapes className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="app">Apps</SelectItem>
              <SelectItem value="artifact">Artifacts</SelectItem>
              <SelectItem value="file">Files</SelectItem>
              <SelectItem value="folder">Folders</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger className="h-8 w-[130px] text-xs" data-testid="hub-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual order</SelectItem>
              <SelectItem value="recents">Recents</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
          </Select>

          {data?.roles && data.roles.orgs.length > 0 && (
            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Users className="w-3 h-3" />
              <span>
                {data.roles.globalRole === "global_admin"
                  ? "Global admin"
                  : data.roles.orgs[0].organizationRole.replace("_", " ")}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ─ Body ─ */}
      <main className="container py-4">
        {tab === "grid" ? (
          <>
            {/* Pager */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mb-3">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={pageIndex === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPageIndex(i)}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        i === pageIndex ? "bg-primary w-4" : "bg-muted-foreground/40",
                      )}
                      aria-label={`Go to page ${i + 1}`}
                    />
                  ))}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageIndex >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-2xl bg-muted/30 animate-pulse"
                  />
                ))}
              </div>
            )}

            {!isLoading && pageTiles.length === 0 && dockTiles.length === 0 && (
              <Card className="p-10 text-center" data-testid="hub-empty">
                <LayoutGrid className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <h2 className="text-base font-semibold">Your Hub is empty</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Pin engines, apps, files, or saved artifacts to organize your work.
                </p>
                <div className="mt-4 flex justify-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => {
                      setCreateOpen(true);
                      setCreateKind("app");
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> New app
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCreateOpen(true);
                      setCreateKind("file");
                    }}
                  >
                    <Upload className="w-4 h-4 mr-1" /> Import file
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setTab("catalog")}>
                    <Globe className="w-4 h-4 mr-1" /> Browse catalog
                  </Button>
                </div>
              </Card>
            )}

            {pageTiles.length > 0 && (
              <SortableHubGrid
                tiles={pageTiles}
                onReorder={handleReorder}
                onTileClick={handleTileClick}
                onShare={(t) => setShareItem(t)}
                onPublish={(t) => setPublishItem(t)}
              />
            )}

            {/* Dock */}
            {dockTiles.length > 0 && (
              <div
                className="mt-6 mx-auto max-w-3xl rounded-2xl border border-border/40 bg-muted/20 backdrop-blur p-2"
                data-testid="hub-dock"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 pb-1">
                  Dock
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {dockTiles.map((tile) => (
                    <HubTileButton
                      key={`dock-${tile.data.id}`}
                      tile={tile}
                      compact
                      onClick={() => handleTileClick(tile)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // ── Catalog tab ────────────────────────────────────────────
          <CatalogList
            catalog={catalog ?? []}
            onInstall={(itemId) => {
              toast("Open the share link this item exposes — public catalog install coming soon.");
            }}
          />
        )}
      </main>

      {/* R14.35: Floating "+" button — rendered via Portal to document.body so
        * position:fixed is anchored to the viewport. Without the portal, the FAB
        * was a child of Hub's overflow-y-auto scroll container which (on iOS)
        * caused a layout-shift jump when the AppLayout main panel finished
        * resizing for the mobile bottom nav.
        */}
      {createPortal(
        <button
          data-testid="hub-fab"
          onClick={() => {
            setCreateOpen(true);
            setCreateKind(null);
          }}
          className="fixed right-4 md:right-8 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform md:bottom-8"
          style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }}
          aria-label="Add to Hub"
        >
          <Plus className="w-5 h-5 md:w-6 md:h-6" />
        </button>,
        document.body,
      )}

      {/* Create dialog */}
      <CreateDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateKind(null);
        }}
        defaultKind={createKind}
        onCreated={() => void utils.hub.list.invalidate()}
      />

      {/* Share dialog */}
      {shareItem && (
        <ShareDialog
          item={shareItem}
          onClose={() => setShareItem(null)}
        />
      )}

      {/* Publish (visibility) dialog */}
      {publishItem && (
        <PublishDialog
          item={publishItem}
          orgs={data?.roles?.orgs ?? []}
          onClose={() => setPublishItem(null)}
          onSaved={() => {
            void utils.hub.list.invalidate();
            setPublishItem(null);
          }}
        />
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Tile button                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

function HubTileButton({
  tile,
  onClick,
  onShare,
  onPublish,
  compact = false,
}: {
  tile: AnyTile;
  onClick: () => void;
  onShare?: () => void;
  onPublish?: () => void;
  compact?: boolean;
}) {
  const data = tile.data as BuiltinTile | HubTile;
  const colorKlass = colorClasses(data.color);
  const isHub = tile.kind === "hub";
  const visibility = isHub ? (data as HubTile).visibility : ("private" as const);
  const badge = visibilityBadge(visibility);
  const Icon = badge.icon;

  return (
    <div
      className={cn(
        "group relative",
        compact ? "" : "",
      )}
    >
      <button
        onClick={onClick}
        data-testid={`hub-tile-${data.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        className={cn(
          "w-full aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.04] active:scale-95",
          colorKlass,
          compact ? "rounded-2xl" : "",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-2xl shadow-inner",
            chipClasses(data.color),
            compact ? "w-9 h-9 text-lg" : "w-12 h-12 md:w-14 md:h-14 text-2xl md:text-3xl",
          )}
        >
          {data.icon ?? "✨"}
        </span>
        <span
          className={cn(
            "text-[11px] md:text-xs font-medium leading-tight px-2 line-clamp-2 text-center text-card-foreground",
            compact && "hidden sm:block",
          )}
        >
          {data.label}
        </span>
      </button>

      {/* Visibility badge */}
      {isHub && !compact && (
        <div
          className={cn(
            "absolute top-1.5 right-1.5 rounded-full bg-background/80 backdrop-blur p-1",
            badge.klass,
          )}
          title={badge.label}
        >
          <Icon className="w-2.5 h-2.5" />
        </div>
      )}

      {/* Action menu (only on hub items, hover) */}
      {isHub && (onShare || onPublish) && !compact && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="absolute -top-1 -left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 border border-border rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
              onClick={(e) => e.stopPropagation()}
              aria-label="Tile actions"
            >
              ⋯
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {onPublish && (
              <DropdownMenuItem onClick={onPublish}>
                <Eye className="w-3.5 h-3.5 mr-2" /> Change visibility
              </DropdownMenuItem>
            )}
            {onShare && (
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="w-3.5 h-3.5 mr-2" /> Get share link
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────── */
/* Sortable grid (drag to reorder, drag onto tile to create folder)         */
/* ────────────────────────────────────────────────────────────────────────────── */

function SortableHubGrid({
  tiles,
  onReorder,
  onTileClick,
  onShare,
  onPublish,
}: {
  tiles: AnyTile[];
  onReorder: (args: { activeId: string; overId: string; dropOnTile: AnyTile | null }) => void;
  onTileClick: (tile: AnyTile) => void;
  onShare: (tile: HubTile) => void;
  onPublish: (tile: HubTile) => void;
}) {
  // Pointer + Touch sensors so iOS Safari supports drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );
  const ids = tiles.map((t) => `${t.kind}-${t.data.id}`);
  const tilesById = new Map(tiles.map((t) => [`${t.kind}-${t.data.id}`, t]));

  function handleEnd(e: DragEndEvent) {
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    onReorder({
      activeId,
      overId,
      dropOnTile: tilesById.get(overId) ?? null,
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3"
          data-testid="hub-grid"
        >
          {tiles.map((tile) => (
            <SortableHubTile
              key={`${tile.kind}-${tile.data.id}`}
              id={`${tile.kind}-${tile.data.id}`}
              tile={tile}
              onClick={() => onTileClick(tile)}
              onShare={tile.kind === "hub" ? () => onShare(tile.data as HubTile) : undefined}
              onPublish={tile.kind === "hub" ? () => onPublish(tile.data as HubTile) : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableHubTile({
  id,
  tile,
  onClick,
  onShare,
  onPublish,
}: {
  id: string;
  tile: AnyTile;
  onClick: () => void;
  onShare?: () => void;
  onPublish?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-testid={`hub-sortable-${id}`}>
      <HubTileButton tile={tile} onClick={onClick} onShare={onShare} onPublish={onPublish} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────── */
/* Create dialog                                                            */
/* ────────────────────────────────────────────────────────────────────────────── */

function CreateDialog({
  open,
  onOpenChange,
  defaultKind,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultKind: null | "app" | "file" | "artifact" | "folder";
  onCreated: () => void;
}) {
  const [kind, setKind] = useState<null | "app" | "file" | "artifact" | "folder">(defaultKind);
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("✨");

  useEffect(() => {
    if (open) {
      setKind(defaultKind);
      setLabel("");
      setIcon(
        defaultKind === "folder"
          ? "📁"
          : defaultKind === "file"
          ? "📎"
          : defaultKind === "artifact"
          ? "✨"
          : defaultKind === "app"
          ? "🧩"
          : "✨",
      );
    }
  }, [open, defaultKind]);

  const importMut = trpc.hub.import.useMutation({
    onSuccess: () => {
      toast.success("Added to Hub");
      onCreated();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });
  const folderMut = trpc.hub.createFolder.useMutation({
    onSuccess: () => {
      toast.success("Folder created");
      onCreated();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  function submit() {
    if (!kind) return;
    if (!label.trim()) {
      toast.error("Give it a name first");
      return;
    }
    if (kind === "folder") {
      folderMut.mutate({ label, icon });
    } else {
      importMut.mutate({ itemType: kind, label, icon });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Hub</DialogTitle>
          <DialogDescription>
            Hub items collapse Apps, Engines, and Library into one organizing surface.
          </DialogDescription>
        </DialogHeader>

        {!kind ? (
          <div className="grid grid-cols-2 gap-2">
            <KindButton icon={<AppWindow />} label="New app" hint="A pinned app or workflow" onClick={() => setKind("app")} />
            <KindButton icon={<Upload />} label="Import file" hint="Upload & pin to Hub" onClick={() => setKind("file")} />
            <KindButton icon={<Sparkles />} label="New artifact" hint="Save a generated result" onClick={() => setKind("artifact")} />
            <KindButton icon={<FolderPlus />} label="New folder" hint="Group related items" onClick={() => setKind("folder")} />
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Icon</label>
              <Input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4}
                className="text-2xl text-center w-16"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={
                  kind === "folder" ? "e.g. Tax 2025" : kind === "file" ? "e.g. RFP draft" : "e.g. My weekly review"
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Created items default to <strong>private</strong>. Use the tile menu to publish to your
              org or get a share link.
            </p>
          </div>
        )}

        <DialogFooter>
          {kind && (
            <Button variant="ghost" onClick={() => setKind(null)}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {kind && (
            <Button onClick={submit} disabled={importMut.isPending || folderMut.isPending}>
              Create
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KindButton({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-3 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-center gap-2 text-foreground mb-0.5">
        <span className="w-4 h-4 flex items-center justify-center text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Share & Publish dialogs                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function ShareDialog({ item, onClose }: { item: HubTile; onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(30);
  const m = trpc.hub.createShareLink.useMutation({
    onSuccess: (r) => setToken(r.token),
    onError: (e) => toast.error(e.message),
  });
  const url =
    token && typeof window !== "undefined"
      ? `${window.location.origin}/hub?install=${encodeURIComponent(token)}`
      : "";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share "{item.label}"</DialogTitle>
          <DialogDescription>
            Anyone with the link can install this item to their Hub. Set an expiry to limit lifetime.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Expires in</label>
            <Select
              value={String(expiresInDays ?? "0")}
              onValueChange={(v) => setExpiresInDays(v === "0" ? undefined : Number(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Never</SelectItem>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!token ? (
            <Button
              onClick={() => m.mutate({ itemId: item.id, expiresInDays })}
              disabled={m.isPending}
            >
              <LinkIcon className="w-4 h-4 mr-1.5" /> Generate link
            </Button>
          ) : (
            <div className="rounded-md border border-border/40 p-2 flex items-center gap-2">
              <code className="text-xs flex-1 overflow-x-auto">{url}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(url);
                  toast.success("Copied");
                }}
              >
                Copy
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PublishDialog({
  item,
  orgs,
  onClose,
  onSaved,
}: {
  item: HubTile;
  orgs: { organizationId: number; organizationName: string; organizationRole: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [visibility, setVisibility] = useState<HubTile["visibility"]>(item.visibility);
  const [orgId, setOrgId] = useState<number | null>(item.organizationId);
  const [minRole, setMinRole] = useState<HubTile["minRole"]>(item.minRole);

  const m = trpc.hub.publish.useMutation({
    onSuccess: () => {
      toast.success("Visibility updated");
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Visibility — "{item.label}"</DialogTitle>
          <DialogDescription>
            Layered permissions cascade: private → org (with min role) → unlisted (token) → public.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {(["private", "org", "unlisted", "public"] as const).map((v) => {
              const b = visibilityBadge(v);
              const Icon = b.icon;
              return (
                <button
                  key={v}
                  onClick={() => setVisibility(v)}
                  className={cn(
                    "p-2 rounded-md border text-left transition-colors",
                    visibility === v
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/40 hover:bg-accent/30",
                  )}
                >
                  <div className={cn("flex items-center gap-1.5 text-sm font-medium", b.klass)}>
                    <Icon className="w-3.5 h-3.5" />
                    {b.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {v === "private" && "Only you"}
                    {v === "org" && "Org members"}
                    {v === "unlisted" && "Anyone with link"}
                    {v === "public" && "Anyone signed in"}
                  </div>
                </button>
              );
            })}
          </div>

          {visibility === "org" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground">Organization</label>
                <Select
                  value={orgId ? String(orgId) : ""}
                  onValueChange={(v) => setOrgId(Number(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Pick an organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => (
                      <SelectItem key={o.organizationId} value={String(o.organizationId)}>
                        {o.organizationName} ({o.organizationRole.replace("_", " ")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Minimum role to see</label>
                <Select
                  value={minRole ?? "any"}
                  onValueChange={(v) => setMinRole(v === "any" ? null : (v as HubTile["minRole"]))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any active member</SelectItem>
                    <SelectItem value="user">User+</SelectItem>
                    <SelectItem value="professional">Professional+</SelectItem>
                    <SelectItem value="manager">Manager+</SelectItem>
                    <SelectItem value="org_admin">Org admin only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              m.mutate({
                itemId: item.id,
                visibility,
                organizationId: visibility === "org" ? orgId : null,
                minRole: visibility === "org" ? minRole : null,
              })
            }
            disabled={m.isPending || (visibility === "org" && !orgId)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/* Catalog                                                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function CatalogList({
  catalog,
  onInstall,
}: {
  catalog: HubTile[];
  onInstall: (id: number) => void;
}) {
  if (catalog.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Globe className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <h3 className="text-base font-semibold">Nothing public yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Items published with visibility="public" will show up here.
        </p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid="hub-catalog">
      {catalog.map((it) => (
        <Card key={it.id} className="p-3 flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
              colorClasses(it.color),
            )}
          >
            {it.icon ?? "✨"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{it.label}</div>
            <div className="text-xs text-muted-foreground capitalize">{it.itemType}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => onInstall(it.id)}>
            Install
          </Button>
        </Card>
      ))}
    </div>
  );
}
