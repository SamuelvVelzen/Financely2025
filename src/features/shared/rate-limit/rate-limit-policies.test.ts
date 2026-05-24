import { describe, expect, it } from "vitest";
import {
  AUTH_DEFAULT_POLICY,
  AUTH_READ_POLICY,
  AUTH_SENSITIVE_POLICY,
  getAuthRateLimitPolicy,
} from "./rate-limit-policies";

describe("getAuthRateLimitPolicy", () => {
  it("uses read policy for GET requests", () => {
    const request = new Request("http://localhost/api/auth/get-session", {
      method: "GET",
    });
    expect(getAuthRateLimitPolicy(request)).toEqual(AUTH_READ_POLICY);
  });

  it("uses sensitive policy for sign-in and password reset", () => {
    const signIn = new Request("http://localhost/api/auth/sign-in/email", {
      method: "POST",
    });
    const reset = new Request("http://localhost/api/auth/forget-password", {
      method: "POST",
    });

    expect(getAuthRateLimitPolicy(signIn)).toEqual(AUTH_SENSITIVE_POLICY);
    expect(getAuthRateLimitPolicy(reset)).toEqual(AUTH_SENSITIVE_POLICY);
  });

  it("uses default policy for other auth POST endpoints", () => {
    const request = new Request("http://localhost/api/auth/some-other-endpoint", {
      method: "POST",
    });
    expect(getAuthRateLimitPolicy(request)).toEqual(AUTH_DEFAULT_POLICY);
  });
});
