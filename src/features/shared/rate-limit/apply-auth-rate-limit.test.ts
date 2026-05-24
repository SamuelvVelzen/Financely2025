import { describe, expect, it, beforeEach } from "vitest";
import { applyAuthRateLimit } from "./apply-auth-rate-limit";
import { AUTH_SENSITIVE_POLICY } from "./rate-limit-policies";

describe("applyAuthRateLimit", () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_DISABLED = "false";
  });

  it("returns null when under the limit", () => {
    const request = new Request(
      `http://localhost/api/auth/sign-in/email-${Date.now()}`,
      { method: "POST" },
    );

    expect(applyAuthRateLimit(request)).toBeNull();
  });

  it("returns 429 when sensitive auth limit is exceeded", () => {
    const path = `/api/auth/sign-in/email-block-${Date.now()}`;
    const request = new Request(`http://localhost${path}`, { method: "POST" });

    for (let i = 0; i < AUTH_SENSITIVE_POLICY.limit; i += 1) {
      expect(applyAuthRateLimit(request)).toBeNull();
    }

    const blocked = applyAuthRateLimit(request);
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toBeTruthy();
  });
});
