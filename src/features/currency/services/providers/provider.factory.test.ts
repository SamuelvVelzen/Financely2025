import { afterEach, describe, expect, it, vi } from "vitest";
import { FrankfurterProvider } from "./frankfurter.provider";
import { MockProvider } from "./mock.provider";
import {
  getExchangeRateProvider,
  resetExchangeRateProviderForTests,
} from "./provider.factory";

describe("getExchangeRateProvider", () => {
  afterEach(() => {
    resetExchangeRateProviderForTests();
    vi.unstubAllEnvs();
  });

  it("returns MockProvider outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getExchangeRateProvider()).toBeInstanceOf(MockProvider);
  });

  it("returns FrankfurterProvider in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getExchangeRateProvider()).toBeInstanceOf(FrankfurterProvider);
  });

  it("reuses the cached provider instance", () => {
    vi.stubEnv("NODE_ENV", "test");
    const first = getExchangeRateProvider();
    const second = getExchangeRateProvider();
    expect(first).toBe(second);
  });
});
