/**
 * Financial Data Router — Public economic data adapters.
 *
 * Live-only: each adapter requires its respective API key and throws a clear
 * error if not configured. No fake-data fallbacks.
 *
 * Adapters:
 *   - FRED   (Federal Reserve Economic Data, https://api.stlouisfed.org/fred)
 *   - BEA    (US Bureau of Economic Analysis, https://apps.bea.gov/api)
 *   - BLS    (US Bureau of Labor Statistics, https://api.bls.gov/publicAPI/v2)
 *   - Census (US Census Bureau, https://api.census.gov/data)
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";

const TIMEOUT_MS = 15_000;

// ─── FRED ───────────────────────────────────────────────────────────────────
const FRED_BASE = "https://api.stlouisfed.org/fred";

async function fredFetch(endpoint: string, params: Record<string, string>): Promise<any> {
  if (!ENV.fredApiKey) throw new Error("FRED_API_KEY is not configured");
  const url = new URL(`${FRED_BASE}/${endpoint}`);
  url.searchParams.set("api_key", ENV.fredApiKey);
  url.searchParams.set("file_type", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`FRED API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ─── BEA ────────────────────────────────────────────────────────────────────
const BEA_BASE = "https://apps.bea.gov/api/data";

async function beaFetch(params: Record<string, string>): Promise<any> {
  if (!ENV.beaApiKey) throw new Error("BEA_API_KEY is not configured");
  const url = new URL(BEA_BASE);
  url.searchParams.set("UserID", ENV.beaApiKey);
  url.searchParams.set("ResultFormat", "JSON");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`BEA API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ─── BLS ────────────────────────────────────────────────────────────────────
const BLS_BASE = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

async function blsFetch(seriesIds: string[], opts: { startYear?: string; endYear?: string }): Promise<any> {
  if (!ENV.blsApiKey) throw new Error("BLS_API_KEY is not configured");
  const body: Record<string, unknown> = {
    seriesid: seriesIds,
    registrationkey: ENV.blsApiKey,
  };
  if (opts.startYear) body.startyear = opts.startYear;
  if (opts.endYear) body.endyear = opts.endYear;
  const res = await fetch(BLS_BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`BLS API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Census ─────────────────────────────────────────────────────────────────
async function censusFetch(dataset: string, params: Record<string, string>): Promise<any> {
  if (!ENV.censusApiKey) throw new Error("CENSUS_API_KEY is not configured");
  const url = new URL(`https://api.census.gov/data/${dataset}`);
  url.searchParams.set("key", ENV.censusApiKey);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Census API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Router ─────────────────────────────────────────────────────────────────
export const financialDataRouter = router({
  /** Configuration / health view of all four adapters */
  status: publicProcedure.query(() => ({
    adapters: [
      { id: "fred", configured: !!ENV.fredApiKey, base: FRED_BASE },
      { id: "bea", configured: !!ENV.beaApiKey, base: BEA_BASE },
      { id: "bls", configured: !!ENV.blsApiKey, base: BLS_BASE },
      { id: "census", configured: !!ENV.censusApiKey, base: "https://api.census.gov/data" },
    ],
  })),

  /** FRED: Fetch a single economic series (e.g. seriesId="GDP", "CPIAUCSL") */
  fredSeries: protectedProcedure
    .input(z.object({
      seriesId: z.string().min(1),
      observationStart: z.string().optional(),
      observationEnd: z.string().optional(),
      limit: z.number().int().min(1).max(1000).optional(),
    }))
    .query(async ({ input }) => {
      const params: Record<string, string> = { series_id: input.seriesId };
      if (input.observationStart) params.observation_start = input.observationStart;
      if (input.observationEnd) params.observation_end = input.observationEnd;
      if (input.limit) params.limit = String(input.limit);
      return fredFetch("series/observations", params);
    }),

  /** FRED: search the catalog of series */
  fredSearch: protectedProcedure
    .input(z.object({
      searchText: z.string().min(1),
      limit: z.number().int().min(1).max(100).default(10),
    }))
    .query(async ({ input }) => {
      return fredFetch("series/search", {
        search_text: input.searchText,
        limit: String(input.limit),
      });
    }),

  /** BEA: GetData on a dataset (e.g. NIPA, Regional, ITA, IIP, FixedAssets) */
  beaGetData: protectedProcedure
    .input(z.object({
      datasetName: z.string().min(1),
      tableName: z.string().min(1),
      frequency: z.string().min(1),
      year: z.string().min(1),
    }))
    .query(async ({ input }) => {
      return beaFetch({
        method: "GetData",
        DataSetName: input.datasetName,
        TableName: input.tableName,
        Frequency: input.frequency,
        Year: input.year,
      });
    }),

  /** BEA: list datasets */
  beaListDatasets: protectedProcedure.query(async () => {
    return beaFetch({ method: "GETDATASETLIST" });
  }),

  /** BLS: fetch one or more time series for a year range */
  blsTimeseries: protectedProcedure
    .input(z.object({
      seriesIds: z.array(z.string().min(1)).min(1).max(50),
      startYear: z.string().regex(/^\d{4}$/).optional(),
      endYear: z.string().regex(/^\d{4}$/).optional(),
    }))
    .query(async ({ input }) => {
      return blsFetch(input.seriesIds, { startYear: input.startYear, endYear: input.endYear });
    }),

  /** Census: query an arbitrary dataset path with a get/for variable selector */
  censusQuery: protectedProcedure
    .input(z.object({
      dataset: z.string().min(1),
      get: z.string().min(1),
      for: z.string().min(1),
      in: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const params: Record<string, string> = { get: input.get, for: input.for };
      if (input.in) params.in = input.in;
      return censusFetch(input.dataset, params);
    }),
});
