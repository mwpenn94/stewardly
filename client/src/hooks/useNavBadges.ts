/**
 * useNavBadges — returns a `Map<string, BadgeInfo>` of badge counts to
 * render next to nav items. Keys are route prefixes (e.g. `/learning`)
 * and values describe how to render the badge.
 *
 * Stub implementation returns an empty Map. Engines emit nav events to
 * the substrate ChatRouter; once that pipe is wired up, this hook will
 * subscribe to those events and populate the Map.
 */
import { useMemo } from "react";

export type BadgeVariant = "count" | "urgent" | "dot";

export interface BadgeInfo {
  count: number;
  variant: BadgeVariant;
}

export type NavBadges = Map<string, BadgeInfo>;

export function useNavBadges(): NavBadges {
  return useMemo<NavBadges>(() => new Map<string, BadgeInfo>(), []);
}

export function formatBadgeCount(count: number): string {
  if (count <= 0) return "";
  if (count >= 100) return "99+";
  return String(count);
}
