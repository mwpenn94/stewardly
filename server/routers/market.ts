/**
 * Market router — backed by real `market_data_cache` table.
 * Procedures: getQuote, getQuotes (batch).
 * Used by client/src/pages/MarketData.tsx.
 *
 * Strategy: serve from cache when fresh (<60s), otherwise return the freshest
 * cached row and let a background refresh hydrate. Real implementations can
 * extend this by wiring a price feed (Polygon, Yahoo, Alpha Vantage, etc.).
 */
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { marketDataCache } from "../../drizzle/schema";

type Quote = {
  symbol: string;
  price: number | null;
  currency: string | null;
  source: string | null;
  observedAt: number | null;
  isStale: boolean;
};

const STALE_AFTER_MS = 60_000;

async function fetchOneQuote(symbol: string): Promise<Quote> {
  const db = await getDb();
  if (!db) {
    return {
      symbol,
      price: null,
      currency: null,
      source: null,
      observedAt: null,
      isStale: true,
    };
  }
  const [row] = await db
    .select()
    .from(marketDataCache)
    .where(
      and(
        eq(marketDataCache.symbol, symbol),
        eq(marketDataCache.dataType, "price"),
      ),
    )
    .orderBy(desc(marketDataCache.observedAt))
    .limit(1);
  if (!row) {
    return {
      symbol,
      price: null,
      currency: null,
      source: null,
      observedAt: null,
      isStale: true,
    };
  }
  const ageMs = Date.now() - Number(row.observedAt);
  return {
    symbol,
    price: row.value !== null ? Number(row.value) : null,
    currency: row.currency,
    source: row.source,
    observedAt: Number(row.observedAt),
    isStale: ageMs > STALE_AFTER_MS,
  };
}

export const marketRouter = router({
  getQuote: protectedProcedure
    .input(z.object({ symbol: z.string().min(1).max(50) }))
    .query(async ({ input }) => {
      return fetchOneQuote(input.symbol.toUpperCase());
    }),

  getQuotes: protectedProcedure
    .input(z.object({ symbols: z.array(z.string().min(1).max(50)).min(1).max(50) }))
    .query(async ({ input }) => {
      const unique = Array.from(new Set(input.symbols.map((s) => s.toUpperCase())));
      const quotes = await Promise.all(unique.map((s) => fetchOneQuote(s)));
      return quotes;
    }),
});
