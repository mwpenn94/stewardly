import { describe, it, expect, afterEach, beforeEach } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions } from "./_core/cookies";

function fakeReq(opts: { protocol?: string; xfp?: string }): Request {
  return {
    protocol: opts.protocol ?? "http",
    headers: opts.xfp ? { "x-forwarded-proto": opts.xfp } : {},
  } as unknown as Request;
}

describe("session cookie options (auth-loop guard)", () => {
  const origNodeEnv = process.env.NODE_ENV;
  beforeEach(() => { process.env.NODE_ENV = "production"; });
  afterEach(() => { process.env.NODE_ENV = origNodeEnv; });

  it("uses sameSite=lax (NOT none) so first-party OAuth callback isn't dropped", () => {
    const opts = getSessionCookieOptions(fakeReq({ protocol: "https" }));
    expect(opts.sameSite).toBe("lax");
  });

  it("forces secure=true in production even when the proxy didn't set x-forwarded-proto", () => {
    const opts = getSessionCookieOptions(fakeReq({ protocol: "http" }));
    expect(opts.secure).toBe(true);
  });

  it("is httpOnly and path=/", () => {
    const opts = getSessionCookieOptions(fakeReq({ protocol: "https" }));
    expect(opts.httpOnly).toBe(true);
    expect(opts.path).toBe("/");
  });

  it("development with plain http does NOT force secure (so localhost works)", () => {
    process.env.NODE_ENV = "development";
    const opts = getSessionCookieOptions(fakeReq({ protocol: "http" }));
    expect(opts.secure).toBe(false);
  });
});
