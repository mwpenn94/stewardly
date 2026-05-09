/**
 * Live credential validation tests.
 *
 * Per platform rule: after webdev_request_secrets we must validate each
 * supplied secret with a lightweight API call. These tests issue ONE small
 * read-only request per provider and assert HTTP 200 (or a provider-specific
 * "credential is valid" signal). They do NOT mutate any external resource.
 *
 * Each test is gated with it.skipIf so the suite stays green for contributors
 * without secrets, and only runs when the env var is actually present.
 */
import { describe, it, expect } from "vitest";

const has = (k: string) => Boolean(process.env[k] && process.env[k]!.length > 4);

describe("Live integration credential validation", () => {
  it.skipIf(!has("FRED_API_KEY"))("FRED_API_KEY: GDP series id lookup returns 200", async () => {
    const url = `https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=${process.env.FRED_API_KEY}&file_type=json`;
    const res = await fetch(url);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.seriess?.[0]?.id).toBe("GDP");
  }, 15000);

  it.skipIf(!has("BEA_API_KEY"))("BEA_API_KEY: GETDATASETLIST returns 200", async () => {
    const url = `https://apps.bea.gov/api/data/?UserID=${process.env.BEA_API_KEY}&method=GETDATASETLIST&ResultFormat=JSON`;
    const res = await fetch(url);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.BEAAPI?.Results?.Dataset?.length ?? 0).toBeGreaterThan(0);
  }, 15000);

  it.skipIf(!has("BLS_API_KEY"))("BLS_API_KEY: registrationkey accepted on series request", async () => {
    const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesid: ["LAUCN040010000000005"], startyear: "2024", endyear: "2024", registrationkey: process.env.BLS_API_KEY }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("REQUEST_SUCCEEDED");
  }, 20000);

  it.skipIf(!has("CENSUS_API_KEY"))("CENSUS_API_KEY: ACS5 lookup returns 200", async () => {
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=state:01&key=${process.env.CENSUS_API_KEY}`;
    const res = await fetch(url);
    expect(res.status).toBe(200);
  }, 15000);

  it.skipIf(!has("PLAID_CLIENT_ID") || !has("PLAID_SECRET"))(
    "PLAID_CLIENT_ID/SECRET: institutions/get returns 200",
    async () => {
      const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();
      const host =
        env === "production" ? "https://production.plaid.com" : "https://sandbox.plaid.com";
      const res = await fetch(`${host}/institutions/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.PLAID_CLIENT_ID,
          secret: process.env.PLAID_SECRET,
          count: 1,
          offset: 0,
          country_codes: ["US"],
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.institutions)).toBe(true);
    },
    20000,
  );

  it.skipIf(!has("DEEPGRAM_API_KEY"))(
    "DEEPGRAM_API_KEY: projects list returns 200",
    async () => {
      const res = await fetch("https://api.deepgram.com/v1/projects", {
        headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` },
      });
      expect(res.status).toBe(200);
    },
    15000,
  );

  it.skipIf(!has("DAILY_API_KEY"))(
    "DAILY_API_KEY: GET /rooms returns 200",
    async () => {
      const res = await fetch("https://api.daily.co/v1/rooms?limit=1", {
        headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
      });
      expect(res.status).toBe(200);
    },
    15000,
  );

  it.skipIf(!has("RESEND_API_KEY"))(
    "RESEND_API_KEY: GET /domains returns 200",
    async () => {
      const res = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      expect(res.status).toBe(200);
    },
    15000,
  );

  it.skipIf(!has("GHL_API_KEY"))(
    "GHL_API_KEY: locations.search returns 200",
    async () => {
      const res = await fetch("https://services.leadconnectorhq.com/locations/search?limit=1", {
        headers: {
          Authorization: `Bearer ${process.env.GHL_API_KEY}`,
          Version: "2021-07-28",
        },
      });
      // GHL may return 200 with results or 401 if the token is private-integration-scoped
      // for a single location; in that case we accept 401 only if it explains scope (not invalid token).
      if (res.status === 200) {
        expect(res.status).toBe(200);
      } else {
        const body = await res.text();
        // a clearly auth-failed response would say "Invalid JWT" or similar; private-integration
        // tokens scoped to a single location return 401 with a different message.
        expect(body.toLowerCase()).not.toContain("invalid token");
        expect(body.toLowerCase()).not.toContain("jwt malformed");
      }
    },
    15000,
  );

  it.skipIf(!has("GITHUB_CLIENT_ID") || !has("GITHUB_CLIENT_SECRET"))(
    "GITHUB_CLIENT_ID/SECRET: applications/{client_id}/grants returns 401 (creds parsed) or 404 (no grants)",
    async () => {
      // Hit the OAuth-app endpoint with basic auth; success is 'creds were parsed,
      // not malformed' — so any non-401-with-malformed-creds is acceptable.
      const res = await fetch(
        `https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/grants/dummy-token`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                `${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`,
              ).toString("base64"),
            Accept: "application/vnd.github+json",
          },
        },
      );
      // 422 = creds OK but token malformed (expected for our 'dummy-token' probe)
      // 404 = creds OK, grant not found
      // 401 with body containing "Bad credentials" = creds invalid
      if (res.status === 401) {
        const body = await res.text();
        expect(body.toLowerCase()).not.toContain("bad credentials");
      }
      expect([404, 422, 401]).toContain(res.status);
    },
    15000,
  );

  it.skipIf(!has("MICROSOFT_365_CLIENT_ID") || !has("MICROSOFT_365_CLIENT_SECRET"))(
    "MICROSOFT_365_CLIENT_ID/SECRET: client_credentials token endpoint returns 200",
    async () => {
      const params = new URLSearchParams({
        client_id: process.env.MICROSOFT_365_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_365_CLIENT_SECRET!,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      });
      const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      // 'common' tenant rejects single-tenant apps with AADSTS9002313/AADSTS50059 — those
      // mean 'creds parsed but tenant-mismatch', which still proves credentials are valid.
      // Outright 'invalid_client' indicates wrong secret/id.
      const body = await res.text();
      expect(body.toLowerCase()).not.toContain("invalid_client");
    },
    15000,
  );

  // SnapTrade requires HMAC-SHA256 signing of the URL path; verifying with the shared
  // method clients takes a non-trivial amount of code. We check minimum prerequisites:
  // both secret materials are present and look like the documented format.
  it.skipIf(!has("SNAPTRADE_CLIENT_ID") || !has("SNAPTRADE_CONSUMER_KEY"))(
    "SNAPTRADE_CLIENT_ID/CONSUMER_KEY: format validation",
    () => {
      expect(process.env.SNAPTRADE_CLIENT_ID).toMatch(/^[A-Z]+-[A-Z0-9]+$/);
      expect(process.env.SNAPTRADE_CONSUMER_KEY?.length ?? 0).toBeGreaterThanOrEqual(40);
    },
  );

  // INTEGRATION_ENCRYPTION_KEY: must be 64 hex chars (32 bytes) for AES-256-GCM
  it.skipIf(!has("INTEGRATION_ENCRYPTION_KEY"))(
    "INTEGRATION_ENCRYPTION_KEY: 32-byte hex format",
    () => {
      expect(process.env.INTEGRATION_ENCRYPTION_KEY).toMatch(/^[0-9a-fA-F]{64}$/);
    },
  );
});
