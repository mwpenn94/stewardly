/**
 * useReducedMotion — react hook returning boolean based on the user's
 * `prefers-reduced-motion` media query. Reactive: subscribes to mql changes
 * so toggling the OS setting immediately propagates.
 *
 * Used by motion-heavy components (CelebrationEngine, AudioCompanion,
 * framer-motion wrappers, lottie players) to short-circuit animations.
 *
 * Pair with the global CSS rule in index.css that already neutralizes
 * CSS-level transitions/animations under prefers-reduced-motion.
 */
import { useEffect, useState } from "react";

const MEDIA_QUERY = "(prefers-reduced-motion: reduce)";

function getInitial(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  try {
    return window.matchMedia(MEDIA_QUERY).matches;
  } catch {
    return false;
  }
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(getInitial);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    let mql: MediaQueryList;
    try {
      mql = window.matchMedia(MEDIA_QUERY);
    } catch {
      return;
    }
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Modern API
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    // Legacy Safari fallback
    // @ts-expect-error legacy MediaQueryList API
    mql.addListener(handler);
    return () => {
      // @ts-expect-error legacy MediaQueryList API
      mql.removeListener(handler);
    };
  }, []);

  return reduced;
}

export default useReducedMotion;
