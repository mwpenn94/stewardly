/**
 * Wave G — applet-instance integration registry tests
 * ======================================================
 *
 *   AR-1  All five engines have at least 1 applet instance
 *   AR-2  emba_modules contributes ≥ 5 Formational instances
 *   AR-3  stewardly-ai contributes ≥ 4 Relational instances
 *   AR-4  Every instance carries at least one command-center pattern
 *   AR-5  Instance ids are globally unique
 *   AR-6  Routes are unique
 *   AR-7  listByEngine + listBySource + listByPattern are consistent
 *   AR-8  getInstance returns undefined for unknown id
 *   AR-9  Every command-center pattern is exercised by ≥ 1 instance
 *  AR-10  Every Formational instance's route starts with /formational
 *  AR-11  Every Relational instance's route starts with /relational
 */
import { describe, it, expect } from "vitest";
import {
  APPLET_INSTANCES,
  listByEngine,
  listBySource,
  listByPattern,
  getInstance,
  type CommandCenterPattern,
} from "../registry";

describe("Wave G — applet-instance registry", () => {
  it("AR-1: all 5 engines have at least 1 applet instance", () => {
    for (const e of ["formational", "relational", "missional", "contextual", "continuous-improvement"] as const) {
      expect(listByEngine(e).length).toBeGreaterThan(0);
    }
  });
  it("AR-2: emba_modules contributes >=5 Formational instances", () => {
    const emba = listBySource("emba_modules");
    expect(emba.length).toBeGreaterThanOrEqual(5);
    expect(emba.every((a) => a.engineId === "formational")).toBe(true);
  });
  it("AR-3: stewardly-ai contributes >=4 Relational instances", () => {
    const sa = listBySource("stewardly-ai");
    expect(sa.length).toBeGreaterThanOrEqual(4);
    expect(sa.every((a) => a.engineId === "relational")).toBe(true);
  });
  it("AR-4: every instance carries >=1 command-center pattern", () => {
    for (const a of APPLET_INSTANCES) expect(a.patterns.length).toBeGreaterThan(0);
  });
  it("AR-5: instance ids are globally unique", () => {
    const ids = APPLET_INSTANCES.map((a) => a.instanceId);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("AR-6: routes are unique", () => {
    const routes = APPLET_INSTANCES.map((a) => a.route);
    expect(new Set(routes).size).toBe(routes.length);
  });
  it("AR-7: query helpers consistent", () => {
    for (const a of APPLET_INSTANCES) {
      expect(listByEngine(a.engineId)).toContainEqual(a);
      expect(listBySource(a.source)).toContainEqual(a);
      for (const p of a.patterns) expect(listByPattern(p)).toContainEqual(a);
    }
  });
  it("AR-8: getInstance returns undefined for unknown id", () => {
    expect(getInstance("nonexistent")).toBeUndefined();
  });
  it("AR-9: every command-center pattern is exercised by >=1 instance", () => {
    const patterns: CommandCenterPattern[] = [
      "applet-sidebar-tab",
      "command-k-action",
      "deep-link",
      "dashboard-tile",
      "task-action",
    ];
    for (const p of patterns) expect(listByPattern(p).length).toBeGreaterThan(0);
  });
  it("AR-10: Formational routes are namespaced", () => {
    for (const a of listByEngine("formational")) {
      expect(a.route.startsWith("/formational")).toBe(true);
    }
  });
  it("AR-11: Relational routes are namespaced", () => {
    for (const a of listByEngine("relational")) {
      expect(a.route.startsWith("/relational")).toBe(true);
    }
  });
});
