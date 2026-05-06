/**
 * DisclosureContext — progressive-disclosure level for nav and panels.
 *
 * Levels:
 *   0 — minimal (logged-out / first-touch — only chat + login)
 *   1 — standard (logged-in defaults — primary engines visible)
 *   2 — advanced (advisor / manager / admin tooling)
 *   3 — power-user (everything)
 *
 * Components opt into deeper detail by checking `level >= N`.
 * The level is persisted in localStorage and can be set via Settings.
 *
 * Ported from stewardly-ai/client/src/contexts/DisclosureContext.tsx
 * (Pass 130 — simplified API).
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DisclosureLevel = 0 | 1 | 2 | 3;

interface DisclosureCtx {
  level: DisclosureLevel;
  setLevel: (level: DisclosureLevel) => void;
}

const STORAGE_KEY = "stewardly:disclosure-level";

const Ctx = createContext<DisclosureCtx>({ level: 1, setLevel: () => {} });

export function DisclosureProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<DisclosureLevel>(() => {
    if (typeof window === "undefined") return 1;
    const v = window.localStorage.getItem(STORAGE_KEY);
    const n = v ? Number(v) : 1;
    return (n === 0 || n === 1 || n === 2 || n === 3 ? n : 1) as DisclosureLevel;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, String(level));
  }, [level]);

  const value = useMemo<DisclosureCtx>(() => ({ level, setLevel: setLevelState }), [level]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDisclosure(): DisclosureCtx {
  return useContext(Ctx);
}
