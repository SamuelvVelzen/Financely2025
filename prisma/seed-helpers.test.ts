import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEED_EMAIL,
  DEFAULT_SEED_FIRST_NAME,
  isProductionBootstrap,
  resolveSeedIdentity,
} from "./seed-helpers";

describe("isProductionBootstrap", () => {
  it("is true only when NODE_ENV is production", () => {
    expect(isProductionBootstrap({ NODE_ENV: "production" })).toBe(true);
    expect(isProductionBootstrap({ NODE_ENV: "development" })).toBe(false);
  });
});

describe("resolveSeedIdentity", () => {
  it("uses demo defaults outside production", () => {
    expect(resolveSeedIdentity({ NODE_ENV: "development" })).toEqual({
      email: DEFAULT_SEED_EMAIL,
      password: "devdevdev",
      firstName: DEFAULT_SEED_FIRST_NAME,
      lastName: "User",
      isProduction: false,
    });
  });

  it("defaults production names to Admin User when unset", () => {
    const identity = resolveSeedIdentity({
      NODE_ENV: "production",
      SEED_USER_EMAIL: "admin@company.com",
      SEED_USER_PASSWORD: "long-secure-password",
    });

    expect(identity.firstName).toBe("Admin");
    expect(identity.lastName).toBe("User");
    expect(identity.email).toBe("admin@company.com");
    expect(identity.isProduction).toBe(true);
  });

  it("respects SEED_USER_FIRST_NAME and SEED_USER_LAST_NAME", () => {
    const identity = resolveSeedIdentity({
      NODE_ENV: "production",
      SEED_USER_EMAIL: "sam@example.com",
      SEED_USER_PASSWORD: "long-secure-password",
      SEED_USER_FIRST_NAME: "Sam",
      SEED_USER_LAST_NAME: "Ney",
    });

    expect(identity.firstName).toBe("Sam");
    expect(identity.lastName).toBe("Ney");
  });
});
