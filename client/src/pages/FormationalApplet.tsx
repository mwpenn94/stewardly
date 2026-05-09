/**
 * /formational — Formational Applet
 * ==================================
 *
 * Wave B.3 — single-applet shell for the Formational engine surface.
 *
 * The Formational engine is responsible for practitioner formation:
 * knowledge cultivation, education, professional development, growth in
 * the practitioner's domain. Its applet exposes the full set of
 * Formational sub-surfaces under one scoped sidebar so users can reach
 * every Formational capability from a single applet entry — exactly
 * matching the pattern established by `MissionalApplet.tsx`.
 *
 * Surfaces included:
 *
 *   Learning
 *     - Learning Home              ← landing for tracks/cards/quizzes
 *     - Skills                     ← skill ledger / SRS heatmap
 *     - Sovereign Study            ← unified study + concept explorer
 *
 *   Knowledge & Library
 *     - My Content                 ← AI-generated study content (CRUD)
 *     - Library                    ← cross-task artifact + file browser
 *     - Knowledge Admin            ← KB + sources management
 *     - Deep Research              ← multi-step research planner
 *
 *   Memory
 *     - Memory                     ← cross-session memory (substrate slice)
 *
 * URL stays under `/formational/*` so the scoped sidebar persists across
 * navigation. Each sub-route mounts the source page; pages that already
 * accept the `embedded` prop receive it so they suppress their own
 * AppShell — the applet is the shell.
 */
import { lazy, Suspense, useMemo } from "react";
import { Link, useLocation, useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  Brain,
  Library as LibraryIcon,
  FolderKanban,
  Lightbulb,
  ListChecks,
  ScrollText,
  Telescope,
} from "lucide-react";

const LearningHome = lazy(() => import("./learning/LearningHome"));
const SkillsPage = lazy(() => import("./SkillsPage"));
const SovereignStudy = lazy(() => import("./SovereignStudy"));
const MyContent = lazy(() => import("./MyContent"));
const Library = lazy(() => import("./Library"));
const KnowledgeAdmin = lazy(() => import("./KnowledgeAdmin"));
const DeepResearchPage = lazy(() => import("./DeepResearchPage"));
const MemoryPage = lazy(() => import("./MemoryPage"));

type TabId =
  | "learning"
  | "skills"
  | "sovereign-study"
  | "my-content"
  | "library"
  | "knowledge-admin"
  | "deep-research"
  | "memory";

const SECTIONS: { group: string; items: { id: TabId; label: string; icon: React.ElementType; description?: string }[] }[] = [
  {
    group: "Learning",
    items: [
      { id: "learning", label: "Learning Home", icon: GraduationCap, description: "Tracks, cards, quizzes" },
      { id: "skills", label: "Skills", icon: ListChecks, description: "SRS heatmap & ledger" },
      { id: "sovereign-study", label: "Sovereign Study", icon: Brain, description: "Unified study & concept explorer" },
    ],
  },
  {
    group: "Knowledge & Library",
    items: [
      { id: "my-content", label: "My Content", icon: ScrollText, description: "AI-generated study content" },
      { id: "library", label: "Library", icon: LibraryIcon, description: "Cross-task artifact browser" },
      { id: "knowledge-admin", label: "Knowledge Admin", icon: FolderKanban, description: "KB + source management" },
      { id: "deep-research", label: "Deep Research", icon: Telescope, description: "Multi-step research planner" },
    ],
  },
  {
    group: "Memory",
    items: [
      { id: "memory", label: "Memory", icon: Lightbulb, description: "Cross-session substrate slice" },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

function Panel({ tab }: { tab: TabId }) {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-64 w-full" /></div>}>
      {tab === "learning" && <LearningHome embedded />}
      {tab === "skills" && <SkillsPage />}
      {tab === "sovereign-study" && <SovereignStudy />}
      {tab === "my-content" && <MyContent />}
      {tab === "library" && <Library />}
      {tab === "knowledge-admin" && <KnowledgeAdmin embedded />}
      {tab === "deep-research" && <DeepResearchPage />}
      {tab === "memory" && <MemoryPage />}
    </Suspense>
  );
}

export default function FormationalApplet() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/formational/:tab");
  const activeTab: TabId = useMemo(() => {
    const t = params?.tab as TabId | undefined;
    return ALL_ITEMS.find((i) => i.id === t)?.id ?? "learning";
  }, [params?.tab]);

  return (
    <div className="flex h-full min-h-0">
      {/* Scoped applet sidebar (desktop) */}
      <aside
        role="complementary"
        aria-label="Formational applet navigation"
        className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border/30 bg-card/30"
      >
        <div className="px-3 py-4 border-b border-border/30">
          <Link href="/hub">
            <div className="flex items-center gap-2 cursor-pointer">
              <BookOpen className="h-5 w-5 text-primary shrink-0" />
              <div>
                <div className="text-sm font-semibold text-foreground">Formational</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Applet</div>
              </div>
            </div>
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-3" aria-label="Formational sections">
            {SECTIONS.map((section) => (
              <div key={section.group} role="group" aria-label={section.group}>
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-2 mb-1">
                  {section.group}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setLocation(item.id === "learning" ? "/formational" : `/formational/${item.id}`)
                        }
                        aria-current={isActive ? "page" : undefined}
                        className={`w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/30"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isActive ? "text-primary" : ""}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{item.label}</div>
                          {item.description && (
                            <div className="text-[10px] text-muted-foreground/60 truncate">{item.description}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Mobile horizontal tab strip */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden border-b border-border/30 bg-card/30 px-2 py-2 overflow-x-auto">
          <div className="flex gap-1" role="tablist" aria-label="Formational tabs">
            {ALL_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() =>
                    setLocation(item.id === "learning" ? "/formational" : `/formational/${item.id}`)
                  }
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "text-muted-foreground hover:bg-accent border border-transparent"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <Panel tab={activeTab} />
        </div>
      </div>
    </div>
  );
}

/**
 * Sparkles icon import note: re-imported to keep Library group icon and
 * the lucide tree-shaking semantics. (No-op runtime cost; same module.)
 */
const _SparklesPin = Sparkles; void _SparklesPin;
