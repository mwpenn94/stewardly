/**
 * useReducedMotion.test.ts — verifies hook returns a boolean and reacts to
 * mql change events.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useReducedMotion } from "./useReducedMotion";

type Listener = (e: { matches: boolean }) => void;

describe("useReducedMotion", () => {
  let listeners: Listener[] = [];
  let currentMatches = false;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: currentMatches,
        media: query,
        onchange: null,
        addEventListener: (_evt: string, cb: Listener) => {
          listeners.push(cb);
        },
        removeEventListener: (_evt: string, cb: Listener) => {
          listeners = listeners.filter((l) => l !== cb);
        },
        addListener: (cb: Listener) => listeners.push(cb),
        removeListener: (cb: Listener) => {
          listeners = listeners.filter((l) => l !== cb);
        },
        dispatchEvent: () => true,
      })),
    });
  });

  it("returns false when reduce-motion is not preferred", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("reacts to media query change events", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => {
      listeners.forEach((l) => l({ matches: true }));
    });
    expect(result.current).toBe(true);
  });

  it("safely returns false when matchMedia is unavailable", () => {
    // @ts-expect-error intentional teardown
    delete (window as unknown as { matchMedia?: unknown }).matchMedia;
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
