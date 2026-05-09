# Integration Port Guide

How to bring each external integration into Stewardly v3 once the operator
provides the required credentials.

Each section assumes a clean v3 starting state and shows: (a) what to copy,
(b) which env keys to set, (c) which db tables to create, (d) how to wire it
into the substrate, (e) how to verify.

---

## §1 SnapTrade / Plaid / FRED / BEA / BLS / Census (wealth data adapters)

These are the wealth data integrations from `mwpenn94/stewardly-ai`. They were
attempted as part of the v3 build but produced 48 typecheck errors because the
manus-next foundation env shape and supporting db tables differ from
stewardly-ai's. Per-handler porting recipe:

### Files to copy from `/home/ubuntu/work/stewardly-ai`
- `server/services/snapTrade.ts`
- `server/services/plaidService.ts`
- `server/services/plaidTokenStore.ts`
- `server/services/financialData/adapters/{beaAdapter,blsAdapter,fredAdapter,plaidAdapter}.ts`
- `server/services/planning/censusApiClient.ts`
- `server/routers/plaid.ts` (registers on `/api/trpc/plaid.*`)

### Env keys to add (Settings → Secrets)
- `SNAPTRADE_CLIENT_ID`, `SNAPTRADE_CONSUMER_KEY`
- `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (`sandbox` | `production`)
- `FRED_API_KEY`
- `BEA_API_KEY`
- `BLS_API_KEY`
- `CENSUS_API_KEY`

### env.ts shim (server/_core/env.ts)
Add to the `Env` interface and runtime check:
```ts
snapTradeClientId: process.env.SNAPTRADE_CLIENT_ID ?? '',
snapTradeConsumerKey: process.env.SNAPTRADE_CONSUMER_KEY ?? '',
plaidClientId: process.env.PLAID_CLIENT_ID ?? '',
plaidSecret: process.env.PLAID_SECRET ?? '',
plaidEnv: (process.env.PLAID_ENV as 'sandbox' | 'production') ?? 'sandbox',
fredApiKey: process.env.FRED_API_KEY ?? '',
beaApiKey: process.env.BEA_API_KEY ?? '',
blsApiKey: process.env.BLS_API_KEY ?? '',
censusApiKey: process.env.CENSUS_API_KEY ?? '',
```

### Tables required
The 414-table v3 additive migration already includes:
- `plaid_token_store`
- `snaptrade_users`
- `snaptrade_accounts`
- `fred_series_cache`
- `bea_series_cache`
- `bls_series_cache`
- `census_query_cache`

Verify with:
```bash
mysql "$DATABASE_URL" -e "SHOW TABLES LIKE 'plaid%'; SHOW TABLES LIKE 'snap%'; SHOW TABLES LIKE 'fred%';"
```

### Wire into substrate
The wealth engine (`server/engines/missional/wealth/`) already expects these
adapters. Edit `server/engines/missional/wealth/index.ts` to import the
adapters and dispatch on `intent.kind`:
```ts
case 'missional.wealth.snaptrade.list': return snapTrade.listAccounts(ctx);
case 'missional.wealth.plaid.link':     return plaid.createLinkToken(ctx);
case 'missional.wealth.fred.fetch':     return fred.fetchSeries(intent.params);
// ... etc
```

### Register the tRPC router
In `server/routers.ts`:
```ts
import { plaidRouter } from './routes/integrations/plaid';
// ...
plaid: plaidRouter,
```

### Verify
```bash
curl -X POST $URL/api/trpc/plaid.createLinkToken -d '{"json":{"userId":1}}'
```
Expected: `{ link_token: "link-sandbox-..." }`

---

## §2 GoHighLevel (CRM webhooks + outbound)

### Files to create
- `server/routes/ghl.ts` (~35 lines)
- `server/_core/index.ts`: register the webhook route at `/api/webhooks/ghl`

### Env keys
- `GHL_LOCATION_ID`
- `GHL_API_KEY`
- `GHL_WEBHOOK_SECRET`

### Skeleton handler
```ts
// server/routes/ghl.ts
import { Router } from 'express';
import crypto from 'node:crypto';

export const ghlWebhookRouter = Router();

ghlWebhookRouter.post('/api/webhooks/ghl', (req, res) => {
  const sig = req.headers['x-ghl-signature'] as string;
  const expected = crypto
    .createHmac('sha256', process.env.GHL_WEBHOOK_SECRET!)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (sig !== expected) return res.status(401).end();

  // dispatch to relational engine
  // engineRouter.handle({ kind: 'relational.ghl.webhook', params: req.body });
  res.json({ ok: true });
});
```

### Verify
```bash
curl -X POST $URL/api/webhooks/ghl \
  -H "x-ghl-signature: $(echo -n '{}' | openssl dgst -sha256 -hmac $GHL_WEBHOOK_SECRET | awk '{print $2}')" \
  -d '{}'
```

---

## §3 Resend (transactional email)

### Files to create
- `server/_core/email.ts`

### Env keys
- `RESEND_API_KEY`
- `EMAIL_FROM` (e.g., `noreply@stewardly.app`)

### Skeleton transport
```ts
// server/_core/email.ts
export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}
```

### Verify
Add a vitest spec mocking `fetch`, then call `sendEmail({to:'test@example.com', ...})`.

---

## §4 Daily.co (video rooms)

### Files to create
- `server/routes/daily.ts`

### Env keys
- `DAILY_API_KEY`
- `DAILY_DOMAIN` (e.g., `stewardly.daily.co`)

### Skeleton handler
```ts
// server/routes/daily.ts
import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';

export const dailyRouter = router({
  createRoom: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input }) => {
      const res = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: input.name, properties: { exp: Date.now()/1000 + 3600 } }),
      });
      if (!res.ok) throw new Error(`Daily ${res.status}`);
      return res.json() as Promise<{ url: string; name: string }>;
    }),
});
```

Register in `server/routers.ts`:
```ts
import { dailyRouter } from './routes/daily';
daily: dailyRouter,
```

### Verify
```bash
curl -X POST $URL/api/trpc/daily.createRoom -d '{"json":{"name":"test-room"}}'
```
Expected: `{ url: "https://stewardly.daily.co/test-room", name: "test-room" }`

---

## §5 Stripe (subscriptions + billing portal)

### Easiest path
Run the platform-managed integration (handles webhook signing + product wiring):
```
webdev_add_feature feature="stripe"
```

### Manual path
- Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`,
  `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENTERPRISE` via Settings → Secrets.
- Create `server/routes/stripe.ts` mounting `/api/webhooks/stripe`.
- Use the `stripe_customers` and `stripe_subscriptions` tables already in the v3
  additive migration.

---

## §6 /api/voice/ws WebSocket streaming (Deepgram)

Latency-optimization upgrade beyond the REST `voice.transcribe` baseline.
Recipe:

### Env keys
- `DEEPGRAM_API_KEY`

### Files to create
- `server/routes/voiceWs.ts` mounting on `/api/voice/ws`

### Skeleton (using `ws` + Deepgram SDK)
```ts
import { WebSocketServer } from 'ws';
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';

export function attachVoiceWs(server: import('http').Server) {
  const wss = new WebSocketServer({ noServer: true });
  const dg = createClient(process.env.DEEPGRAM_API_KEY!);

  server.on('upgrade', (req, sock, head) => {
    if (req.url === '/api/voice/ws') wss.handleUpgrade(req, sock, head, ws => wss.emit('connection', ws, req));
  });

  wss.on('connection', (ws) => {
    const live = dg.listen.live({ model: 'nova-2', smart_format: true });
    live.on(LiveTranscriptionEvents.Transcript, (data) => ws.send(JSON.stringify(data)));
    ws.on('message', (chunk) => live.send(chunk as Buffer));
    ws.on('close', () => live.finish());
  });
}
```

Wire into `server/_core/index.ts`:
```ts
import { attachVoiceWs } from '../routes/voiceWs';
const server = app.listen(port, ...);
attachVoiceWs(server);
```

VoiceOrb component already streams to `/api/voice/ws` if that endpoint is mounted.

---

## Per-integration checklist template

Copy this into a PR description when porting a single integration:

- [ ] Files copied
- [ ] Env keys added to `server/_core/env.ts` interface + runtime check
- [ ] Env keys provided via Settings → Secrets
- [ ] Required tables exist in DB (verified with `SHOW TABLES`)
- [ ] Router registered in `server/routers.ts` (or webhook in `server/_core/index.ts`)
- [ ] Vitest spec covers happy path with mocked external HTTP
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx vitest run` passes
- [ ] Manual smoke test against the live preview URL passes
