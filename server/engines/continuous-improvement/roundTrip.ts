/**
 * Wave B-6 — Conversational-to-persistent round-trip metrics
 * ============================================================
 *
 * Commitment C-25: instrument the TaskChat → Hub round-trip (creating an
 * artifact in the conversational surface and surfacing it on the Hub
 * persistent surface) with timing and success metrics, surfaced through
 * the Continuous-Improvement engine as `coverage.snapshot`'s sibling
 * intent: `continuous-improvement.roundtrip.report`.
 *
 * Why an in-process ring buffer:
 *   The metrics are observability data, not business state. They live in
 *   memory across the request stream of a single process. If the user
 *   needs durable analytics, they can flip on the existing analytics
 *   pipeline (it is already wired). This module provides the live
 *   "right now, what's the round-trip latency" answer that the CI engine
 *   can surface in a dashboard tile.
 *
 * The buffer is a simple bounded list (capacity 1000). It is process-
 * local and intentionally cheap. Tests for this module exercise both
 * the observation and the report paths, plus the bounded-buffer
 * eviction policy.
 */

export interface RoundTripObservation {
  /** External task id (TaskChat surface). */
  taskId: number | string;
  /** The hubItems row id created by the promotion (Hub surface). */
  hubItemId: number | string;
  /** ms-since-epoch when the user pressed "send to Hub". */
  startedAt: number;
  /** ms-since-epoch when the Hub row appeared in the read path. */
  completedAt: number;
  /** Whether the round-trip succeeded end-to-end. */
  success: boolean;
}

export interface RoundTripReport {
  /** Total observations currently in the buffer. */
  sampleCount: number;
  /** Successful observations / total observations. 0..1. */
  successRate: number;
  /** Median latency (ms). 0 when no samples. */
  p50LatencyMs: number;
  /** 95th-percentile latency (ms). 0 when no samples. */
  p95LatencyMs: number;
  /** Most recent observation's completedAt (ms-since-epoch), or 0. */
  lastObservationAt: number;
  /** Buffer capacity. */
  capacity: number;
}

const CAPACITY = 1000;

const buffer: RoundTripObservation[] = [];

/** Returns the observation id (the index in the rolling buffer at insert time). */
export function observeRoundTrip(obs: RoundTripObservation): number {
  // Defensive copy — the caller may reuse its object.
  const copy: RoundTripObservation = { ...obs };
  buffer.push(copy);
  if (buffer.length > CAPACITY) {
    // Drop the oldest. The buffer is small enough that an unshift is fine.
    buffer.shift();
  }
  return buffer.length - 1;
}

export function getRoundTripReport(): RoundTripReport {
  if (buffer.length === 0) {
    return {
      sampleCount: 0,
      successRate: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      lastObservationAt: 0,
      capacity: CAPACITY,
    };
  }
  const successes = buffer.filter((o) => o.success).length;
  const latencies = buffer.map((o) => Math.max(0, o.completedAt - o.startedAt)).sort((a, b) => a - b);
  return {
    sampleCount: buffer.length,
    successRate: successes / buffer.length,
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    lastObservationAt: buffer[buffer.length - 1].completedAt,
    capacity: CAPACITY,
  };
}

/** Test-only reset for deterministic suites. */
export function __resetRoundTripBufferForTests(): void {
  buffer.length = 0;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  // Linear interpolation between neighbors.
  const t = idx - lo;
  return Math.round(sorted[lo] * (1 - t) + sorted[hi] * t);
}
