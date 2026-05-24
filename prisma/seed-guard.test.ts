import { describe, expect, it } from "vitest";
import { checkSeedEnvironment } from "./seed-guard";

describe("checkSeedEnvironment", () => {
  it("allows seed in non-production", () => {
    expect(checkSeedEnvironment({ NODE_ENV: "development" })).toEqual({
      allowed: true,
    });
  });

  it("blocks seed in production with default credentials", () => {
    const result = checkSeedEnvironment({ NODE_ENV: "production" });
    expect(result.allowed).toBe(false);
    expect(result.errorMessage).toContain("production");
  });

  it("allows production seed only with safe overrides", () => {
    const result = checkSeedEnvironment({
      NODE_ENV: "production",
      SEED_ALLOW_IN_PRODUCTION: "true",
      SEED_USER_EMAIL: "admin@company.com",
      SEED_USER_PASSWORD: "long-secure-password",
    });

    expect(result.allowed).toBe(true);
    expect(result.warning).toBeTruthy();
  });

  it("blocks production seed when override password is too weak", () => {
    const result = checkSeedEnvironment({
      NODE_ENV: "production",
      SEED_ALLOW_IN_PRODUCTION: "true",
      SEED_USER_EMAIL: "admin@company.com",
      SEED_USER_PASSWORD: "devdevdev",
    });

    expect(result.allowed).toBe(false);
  });
});
