import { describe, expect, it } from "vitest";
import { MOCK_RATES } from "./providers/mock-rates.fixture";
import { ExchangeRateService } from "./exchange-rate.service";

describe("ExchangeRateService.getCrossRate", () => {
  it("returns 1 for identical currencies", () => {
    expect(ExchangeRateService.getCrossRate("EUR", "EUR", MOCK_RATES)).toBe(1);
  });

  it("derives cross-rates from EUR-base rates", () => {
    expect(
      ExchangeRateService.getCrossRate("USD", "GBP", MOCK_RATES),
    ).toBeCloseTo(0.85 / 1.08);
    expect(
      ExchangeRateService.getCrossRate("GBP", "USD", MOCK_RATES),
    ).toBeCloseTo(1.08 / 0.85);
  });

  it("returns null when either currency is missing", () => {
    expect(
      ExchangeRateService.getCrossRate("USD", "ABC", MOCK_RATES),
    ).toBeNull();
  });
});
