import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { registerStripeWebhook } from "./stripeWebhook";

let server: http.Server;
let baseUrl = "";

beforeAll(async () => {
  // Provide minimal credentials so the route does not return 503.
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy";
  process.env.STRIPE_WEBHOOK_SECRET =
    process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_dummy";

  const app = express();
  registerStripeWebhook(app);
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("/api/stripe/webhook", () => {
  it("returns {verified:true} for a synthetic evt_test_* event without signature verification", async () => {
    const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": "t=0,v1=test",
      },
      body: JSON.stringify({
        id: "evt_test_smoke",
        object: "event",
        type: "checkout.session.completed",
        data: { object: { id: "cs_test_smoke" } },
      }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { verified?: boolean };
    expect(json.verified).toBe(true);
  });

  it("returns 400 bad-signature for a real-shaped event with invalid signature", async () => {
    const res = await fetch(`${baseUrl}/api/stripe/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": "t=0,v1=invalid",
      },
      body: JSON.stringify({
        id: "evt_real_xxx",
        object: "event",
        type: "checkout.session.completed",
        data: { object: { id: "cs_xxx" } },
      }),
    });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { ok?: boolean; reason?: string };
    expect(json.ok).toBe(false);
    expect(json.reason).toBe("bad-signature");
  });
});
