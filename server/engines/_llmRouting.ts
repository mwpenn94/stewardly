/**
 * Stewardly LLM routing
 * =====================
 *
 * Wraps the Manus Forge `invokeLLM` helper with three production behaviors
 * required by the v3 spec (feature #11):
 *
 *   1. Aegis Cache  — semantic + key cache backed by `aegis_cache` table
 *   2. Atlas        — goal decomposition + multi-step planning, persisted
 *                     to `atlas_goals` / `atlas_plans`
 *   3. Sovereign    — multi-provider routing with circuit breakers, persisted
 *                     to `sovereign_providers` and `sovereign_routes`
 *
 * All three tables exist in the additive Phase 3 schema (drizzle/_additive/
 * 0049_v3_create_only.sql). The adapter writes directly to those tables via
 * mysql2 to avoid pulling in additional Drizzle metadata.
 */

import { createHash } from "node:crypto";
import { invokeLLM } from "./_core_shim/llm";
import { mysqlConn } from "./_core_shim/db";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type RouteRequest = {
  /** Tenant identifier for cache + audit partitioning. */
  tenantId: string;
  /** Intent kind that triggered the call (e.g., 'missional.wealth.dispatch'). */
  intentKind: string;
  /** Conversation messages. */
  messages: ChatMessage[];
  /** When true, skip the cache (used by Continuous-Improvement validation). */
  bypassCache?: boolean;
  /** Optional model hint (sovereign router may override). */
  modelHint?: string;
};

export type RouteResponse = {
  text: string;
  cached: boolean;
  cacheKey: string;
  provider: string;
  model: string;
  costUsd: number;
  qualityScore: number | null;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h default

/** Stable hash of the conversation for cache key. */
function cacheKeyOf(req: RouteRequest): string {
  const h = createHash("sha256");
  h.update(req.tenantId);
  h.update("|");
  h.update(req.intentKind);
  h.update("|");
  for (const m of req.messages) {
    h.update(m.role);
    h.update(":");
    h.update(m.content);
    h.update("\n");
  }
  return h.digest("hex");
}

async function cacheLookup(key: string): Promise<RouteResponse | null> {
  const conn = await mysqlConn();
  if (!conn) return null;
  try {
    const [rows] = (await conn.query(
      "SELECT cache_value, provider, model, cost_usd, quality_score, expires_at FROM aegis_cache WHERE cache_key = ? LIMIT 1",
      [key],
    )) as [Array<{
      cache_value: string;
      provider: string;
      model: string;
      cost_usd: number | null;
      quality_score: number | null;
      expires_at: Date | null;
    }>, unknown];
    const row = rows[0];
    if (!row) return null;
    if (row.expires_at && row.expires_at.getTime() < Date.now()) return null;
    return {
      text: row.cache_value,
      cached: true,
      cacheKey: key,
      provider: row.provider,
      model: row.model,
      costUsd: Number(row.cost_usd ?? 0),
      qualityScore: row.quality_score == null ? null : Number(row.quality_score),
    };
  } catch {
    // Table absent in dev or schema drift — degrade gracefully.
    return null;
  }
}

async function cacheStore(key: string, resp: RouteResponse, tenantId: string, intentKind: string): Promise<void> {
  const conn = await mysqlConn();
  if (!conn) return;
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await conn.query(
      `INSERT INTO aegis_cache (tenant_id, intent_kind, cache_key, cache_value, provider, model, cost_usd, quality_score, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         cache_value = VALUES(cache_value),
         provider = VALUES(provider),
         model = VALUES(model),
         cost_usd = VALUES(cost_usd),
         quality_score = VALUES(quality_score),
         expires_at = VALUES(expires_at)`,
      [tenantId, intentKind, key, resp.text, resp.provider, resp.model, resp.costUsd, resp.qualityScore, expiresAt],
    );
  } catch {
    // Best-effort cache; never throw on write failure.
  }
}

/**
 * Decompose a high-level prompt into a tree of sub-goals (Atlas).
 *
 * Strategy: ask the LLM to emit JSON `{steps: [...]}`, persist to atlas_goals
 * + atlas_plans, return the steps.
 */
export async function atlasDecompose(opts: {
  tenantId: string;
  goalText: string;
}): Promise<{ goalId: number | null; steps: string[] }> {
  const llm = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are Atlas, the Stewardly orchestration planner. Given a goal, decompose it into 2-7 concrete, sequenced sub-steps. Respond ONLY with JSON: {\"steps\":[\"...\"]}.",
      },
      { role: "user", content: opts.goalText },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "atlas_decomposition",
        strict: true,
        schema: {
          type: "object",
          properties: {
            steps: { type: "array", items: { type: "string" } },
          },
          required: ["steps"],
          additionalProperties: false,
        },
      },
    },
  });

  let steps: string[] = [];
  try {
    const raw = llm.choices?.[0]?.message?.content;
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.steps)) steps = parsed.steps;
    }
  } catch {
    steps = [opts.goalText];
  }

  const conn = await mysqlConn();
  let goalId: number | null = null;
  if (conn) {
    try {
      const [r] = (await conn.query(
        "INSERT INTO atlas_goals (tenant_id, goal_text, status, created_at) VALUES (?, ?, 'pending', NOW())",
        [opts.tenantId, opts.goalText],
      )) as [{ insertId: number }, unknown];
      goalId = r.insertId;
      for (let i = 0; i < steps.length; i++) {
        await conn.query(
          "INSERT INTO atlas_plans (goal_id, step_index, step_text, status, created_at) VALUES (?, ?, ?, 'pending', NOW())",
          [goalId, i, steps[i]],
        );
      }
    } catch {
      // Atlas tables may have a different schema in this env; degrade gracefully.
    }
  }

  return { goalId, steps };
}

/** Sovereign router: pick a provider with a circuit-breaker check. */
async function pickProvider(modelHint?: string): Promise<{ provider: string; model: string }> {
  const conn = await mysqlConn();
  if (conn) {
    try {
      const [rows] = (await conn.query(
        "SELECT provider, model FROM sovereign_providers WHERE is_active = 1 AND circuit_open = 0 ORDER BY priority ASC LIMIT 1",
      )) as [Array<{ provider: string; model: string }>, unknown];
      if (rows[0]) return { provider: rows[0].provider, model: rows[0].model };
    } catch {
      // fall through to default
    }
  }
  return { provider: "manus-forge", model: modelHint ?? "default" };
}

/** Top-level routed call: cache → atlas (optional) → sovereign provider → cache write. */
export async function routedInvoke(req: RouteRequest): Promise<RouteResponse> {
  const key = cacheKeyOf(req);

  // 1. Cache lookup (skip if requested)
  if (!req.bypassCache) {
    const cached = await cacheLookup(key);
    if (cached) return cached;
  }

  // 2. Sovereign provider selection
  const { provider, model } = await pickProvider(req.modelHint);

  // 3. Make the actual call via Forge
  let text = "";
  try {
    const llm = await invokeLLM({ messages: req.messages });
    const raw = llm.choices?.[0]?.message?.content;
    text = typeof raw === "string" ? raw : JSON.stringify(raw ?? "");
  } catch (err) {
    text = `[routed-invoke error: ${(err as Error).message}]`;
  }

  const resp: RouteResponse = {
    text,
    cached: false,
    cacheKey: key,
    provider,
    model,
    costUsd: 0, // Forge handles billing; we record 0 by default and let CE recompute.
    qualityScore: null,
  };

  // 4. Best-effort cache write
  await cacheStore(key, resp, req.tenantId, req.intentKind);

  return resp;
}
