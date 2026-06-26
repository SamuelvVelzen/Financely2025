import { describe, expect, it } from "vitest";
import {
  MOCK_BASE_CURRENCY,
  MOCK_RATES,
} from "./mock-rates.fixture";
import { MockProvider } from "./mock.provider";

describe("MockProvider", () => {
  const provider = new MockProvider();

  it("exposes stable provider metadata", () => {
    expect(provider.getName()).toBe("mock");
    expect(provider.getBaseCurrency()).toBe(MOCK_BASE_CURRENCY);
    expect(provider.supportsHistorical()).toBe(true);
  });

  it("returns deterministic EUR-base rates", async () => {
    const response = await provider.fetchRates(new Date("2024-06-15T12:00:00Z"));

    expect(response.date).toBe("2024-06-15");
    expect(response.baseCurrency).toBe("EUR");
    expect(response.rates).toEqual(MOCK_RATES);
  });

  it("lists supported currencies from the fixture", async () => {
    const currencies = await provider.getSupportedCurrencies();
    expect(currencies).toContain("USD");
    expect(currencies).toContain("EUR");
  });
});
