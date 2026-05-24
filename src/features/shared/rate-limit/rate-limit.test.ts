import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_DISABLED = "false";
  });

  it("allows requests within the limit", () => {
    const policy = { limit: 3, windowMs: 60_000 };
    const key = `test-allow-${Date.now()}-${Math.random()}`;

    expect(checkRateLimit(key, policy).allowed).toBe(true);
    expect(checkRateLimit(key, policy).allowed).toBe(true);
    expect(checkRateLimit(key, policy).allowed).toBe(true);
  });

  it("blocks requests above the limit", () => {
    const policy = { limit: 2, windowMs: 60_000 };
    const key = `test-block-${Date.now()}-${Math.random()}`;

    expect(checkRateLimit(key, policy).allowed).toBe(true);
    expect(checkRateLimit(key, policy).allowed).toBe(true);

    const blocked = checkRateLimit(key, policy);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("can be disabled via env", () => {
    process.env.RATE_LIMIT_DISABLED = "true";
    const policy = { limit: 1, windowMs: 60_000 };
    const key = `test-disabled-${Date.now()}`;

    expect(checkRateLimit(key, policy).allowed).toBe(true);
    expect(checkRateLimit(key, policy).allowed).toBe(true);
  });
});
