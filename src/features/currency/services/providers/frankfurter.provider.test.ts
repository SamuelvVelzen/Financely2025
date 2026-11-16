import { describe, expect, it, vi, afterEach } from "vitest";
import { FrankfurterProvider } from "./frankfurter.provider";

const provider = new FrankfurterProvider();

const v2RatesFixture: Array<{
  date: string;
  base: string;
  quote: string;
  rate: number;
}> = [
  { date: "2024-01-15", base: "EUR", quote: "EUR", rate: 1 },
  { date: "2024-01-15", base: "EUR", quote: "USD", rate: 1.089 },
  { date: "2024-01-15", base: "EUR", quote: "GBP", rate: 0.8623 },
];

describe("FrankfurterProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses v2 /rates array response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => v2RatesFixture,
      }),
    );

    const result = await provider.fetchRates(new Date("2024-01-15T12:00:00.000Z"));

    expect(fetch).toHaveBeenCalledWith(
      "https://api.frankfurter.dev/v2/rates?base=EUR&date=2024-01-15",
    );
    expect(result.baseCurrency).toBe("EUR");
    expect(result.date).toBe("2024-01-15");
    expect(result.rates.USD).toBe(1.089);
    expect(result.rates.GBP).toBe(0.8623);
  });

  it("requests latest rates without a date for today", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T12:00:00.000Z"));

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => v2RatesFixture,
      }),
    );

    await provider.fetchRates(new Date("2024-01-15T12:00:00.000Z"));

    expect(fetch).toHaveBeenCalledWith(
      "https://api.frankfurter.dev/v2/rates?base=EUR",
    );

    vi.useRealTimers();
  });
});
