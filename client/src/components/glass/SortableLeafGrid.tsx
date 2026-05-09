/**
 * SortableLeafGrid — drag-and-drop sortable grid of engine leaves wrapped in
 * GlassCard tiles. Persists ordering through `trpc.engines.setLayout` so the
 * arrangement follows the user across sessions and devices.
 *
 * Drag UX: long-press / pointer-down anywhere on the tile lifts it (8px
 * activation distance to allow normal click-through to the tile's link).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, GripVertical } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useContext } from "react";
import { trpc } from "@/lib/trpc";
import { AuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import GlassCard from "./GlassCard";
import type { EngineLeaf } from "@shared/engineTaxonomy";

interface SortableLeafGridProps {
  engineId: string;
  leaves: EngineLeaf[];
  /** When false, drag is disabled (e.g. unauthenticated visitors). */
  persist?: boolean;
}

function LeafGlassTile({ leaf, draggable }: { leaf: EngineLeaf; draggable: boolean }) {
  const Icon = leaf.icon;
  const sortable = useSortable({ id: leaf.path, disabled: !draggable });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : "auto" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Link href={leaf.path}>
        <GlassCard
          interactive
          intensity="regular"
          data-testid={`engine-leaf-${leaf.path}`}
          className={cn("h-full cursor-pointer p-4 select-none", isDragging && "ring-2 ring-primary/40")}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="rounded-lg bg-white/10 dark:bg-white/5 p-2 ring-1 ring-white/10">
              <Icon className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex items-center gap-1">
              {draggable && (
                <button
                  type="button"
                  aria-label="Drag to reorder"
                  data-testid={`engine-leaf-drag-${leaf.path}`}
                  // The drag handle stops propagation so the underlying Link
                  // never fires when the user is grabbing the tile to move.
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  {...listeners}
                  className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground touch-none cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>
              )}
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm font-medium text-foreground tracking-tight">{leaf.label}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Open</p>
          </div>
        </GlassCard>
      </Link>
    </div>
  );
}

export default function SortableLeafGrid({ engineId, leaves, persist = true }: SortableLeafGridProps) {
  // Tolerant read — if this component is mounted outside the AuthProvider
  // (e.g. preview shell, marketing surface), fall back to unauth instead of
  // throwing the way useAuth() would.
  const authCtx = useContext(AuthContext);
  const user = authCtx?.user ?? null;
  const isAuthed = !!user && persist;

  // Default order = taxonomy order. Authed users may have a saved order.
  const layoutQuery = trpc.engines.getLayout.useQuery(
    { engineId },
    { enabled: isAuthed, staleTime: 60_000 },
  );
  const setLayout = trpc.engines.setLayout.useMutation();

  const defaultIds = useMemo(() => leaves.map((l) => l.path), [leaves]);
  const [orderedIds, setOrderedIds] = useState<string[]>(defaultIds);

  // Sync server order in once it loads. We intersect with the taxonomy
  // so removed leaves are dropped and newly added leaves are appended.
  useEffect(() => {
    if (!isAuthed) {
      setOrderedIds(defaultIds);
      return;
    }
    if (!layoutQuery.data) return;
    const saved = layoutQuery.data.order ?? [];
    const validSaved = saved.filter((id) => defaultIds.includes(id));
    const missing = defaultIds.filter((id) => !validSaved.includes(id));
    setOrderedIds([...validSaved, ...missing]);
  }, [isAuthed, layoutQuery.data, defaultIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedIds((current) => {
      const oldIndex = current.indexOf(String(active.id));
      const newIndex = current.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return current;
      const next = arrayMove(current, oldIndex, newIndex);
      if (isAuthed) {
        setLayout.mutate({ engineId, order: next });
      }
      return next;
    });
  };

  const orderedLeaves = useMemo(() => {
    const map = new Map(leaves.map((l) => [l.path, l]));
    return orderedIds.map((id) => map.get(id)).filter(Boolean) as EngineLeaf[];
  }, [orderedIds, leaves]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div
          data-testid={`engine-${engineId}-sortable-grid`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {orderedLeaves.map((leaf) => (
            <LeafGlassTile key={leaf.path} leaf={leaf} draggable={isAuthed} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
