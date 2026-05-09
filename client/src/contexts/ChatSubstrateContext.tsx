/**
 * ChatSubstrateContext — single source of truth for the user-supplied
 * glass substrate widgets (Memory, ATLAS, Workspace, SearchCascade,
 * QualityScore). Widgets read these slices and render ONLY when the
 * slice is non-empty, so they never display fake/placeholder data.
 *
 * Backend signals plug into this provider via tRPC subscriptions
 * once emitted; until then, the slices stay empty and the widgets
 * stay hidden, which is the correct user-facing behavior.
 *
 * Slice shapes mirror each widget's declared props 1:1 (no translation).
 */
import { createContext, useContext, type ReactNode } from "react";
import type { Artifact } from "@/components/glass/substrate/WorkspaceArtifactsPanel";

// QualityScoreDisplay
export interface QualityScore {
  accuracy: number;
  completeness: number;
  relevance: number;
  coherence: number;
  safety: number;
  overall: number;
}

// MemoryInsightPanel
type MemoryCategory = "preference" | "context" | "financial" | "behavioral";
export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  content: string;
  confidence: number;
  lastAccessed: string;
  accessCount: number;
}
export interface MemorySlice {
  memories: MemoryItem[];
  totalMemories: number;
  consolidationScore: number;
}

// ATLASGoalPanel
export interface ATLASSubGoal {
  id: string;
  description: string;
  status: "pending" | "active" | "complete" | "blocked";
  priority: "high" | "medium" | "low";
  dependencies?: string[];
}
export interface ATLASSlice {
  goal: string;
  subGoals: ATLASSubGoal[];
  progress: number; // 0-100
}

// SearchCascadePanel
type SearchTier = "cache" | "local" | "web" | "deep";
export interface SearchTierResult {
  tier: SearchTier;
  status: "pending" | "searching" | "complete" | "skipped";
  latencyMs?: number;
  resultCount?: number;
  source?: string;
}
export interface SearchCascadeSlice {
  query: string;
  tiers: SearchTierResult[];
  totalResults?: number;
}

export interface ChatSubstrate {
  qualityScore: QualityScore | null;
  memory: MemorySlice | null;
  atlas: ATLASSlice | null;
  workspaceArtifacts: Artifact[];
  searchCascade: SearchCascadeSlice | null;
}

const EMPTY_SUBSTRATE: ChatSubstrate = {
  qualityScore: null,
  memory: null,
  atlas: null,
  workspaceArtifacts: [],
  searchCascade: null,
};

const ChatSubstrateCtx = createContext<ChatSubstrate>(EMPTY_SUBSTRATE);

export function ChatSubstrateProvider({
  value,
  children,
}: {
  value?: Partial<ChatSubstrate>;
  children: ReactNode;
}) {
  const merged: ChatSubstrate = { ...EMPTY_SUBSTRATE, ...(value ?? {}) };
  return <ChatSubstrateCtx.Provider value={merged}>{children}</ChatSubstrateCtx.Provider>;
}

export function useChatSubstrate(): ChatSubstrate {
  return useContext(ChatSubstrateCtx);
}
