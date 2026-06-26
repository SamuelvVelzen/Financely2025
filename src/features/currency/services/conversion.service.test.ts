import { describe, expect, it } from "vitest";
import { MOCK_RATES } from "./providers/mock-rates.fixture";
import {
  buildRatesByDateMap,
  convertAmount,
  extractUniqueTransactionDates,
  getConversionRate,
  getTransactionAmountInCurrency,
} from "./conversion.service";

describe("getConversionRate", () => {
  it("returns 1 for the same currency", () => {
    expect(getConversionRate("EUR", "EUR", MOCK_RATES)).toBe(1);
  });

  it("computes cross-rates from EUR-base rates", () => {
    expect(getConversionRate("USD", "EUR", MOCK_RATES)).toBeCloseTo(1 / 1.08);
    expect(getConversionRate("EUR", "USD", MOCK_RATES)).toBeCloseTo(1.08);
  });

  it("returns null when a currency is missing", () => {
    expect(getConversionRate("USD", "XYZ", MOCK_RATES)).toBeNull();
  });

  it("returns null when the source rate is zero", () => {
    expect(getConversionRate("USD", "EUR", { USD: 0, EUR: 1 })).toBeNull();
  });
});

describe("convertAmount", () => {
  it("converts using target currency minor units", () => {
    const result = convertAmount(100, "USD", "EUR", MOCK_RATES);
    expect(result).toBeCloseTo(92.59, 2);
  });

  it("returns the same amount when currencies match", () => {
    expect(convertAmount(42.5, "EUR", "EUR", MOCK_RATES)).toBe(42.5);
  });

  it("returns null when conversion is not possible", () => {
    expect(convertAmount(10, "USD", "UNKNOWN", MOCK_RATES)).toBeNull();
  });
});

describe("buildRatesByDateMap", () => {
  it("indexes rates by date key", () => {
    const map = buildRatesByDateMap([
      {
        date: "2024-06-01",
        baseCurrency: "EUR",
        rates: MOCK_RATES,
      },
      {
        date: "2024-06-02",
        baseCurrency: "EUR",
        rates: { EUR: 1, USD: 1.09 },
      },
    ]);

    expect(map["2024-06-01"].rates.USD).toBe(1.08);
    expect(map["2024-06-02"].rates.USD).toBe(1.09);
  });
});

describe("extractUniqueTransactionDates", () => {
  it("deduplicates and normalizes to YYYY-MM-DD", () => {
    const dates = extractUniqueTransactionDates([
      { transactionDate: "2024-06-01T10:00:00.000Z" },
      { transactionDate: "2024-06-01T18:00:00.000Z" },
      { transactionDate: "2024-06-02T00:00:00.000Z" },
    ]);

    expect(dates).toEqual(["2024-06-01", "2024-06-02"]);
  });
});

describe("getTransactionAmountInCurrency", () => {
  const ratesByDate = buildRatesByDateMap([
    {
      date: "2024-06-01",
      baseCurrency: "EUR",
      rates: MOCK_RATES,
    },
    {
      date: "2024-06-10",
      baseCurrency: "EUR",
      rates: { EUR: 1, USD: 1.1 },
    },
  ]);

  it("returns the parsed amount when currencies match", () => {
    expect(
      getTransactionAmountInCurrency(
        "12.34",
        "EUR",
        "EUR",
        "2024-06-01T00:00:00.000Z",
        ratesByDate,
      ),
    ).toBe(12.34);
  });

  it("converts using rates for the transaction date", () => {
    expect(
      getTransactionAmountInCurrency(
        "108",
        "USD",
        "EUR",
        "2024-06-01T00:00:00.000Z",
        ratesByDate,
      ),
    ).toBeCloseTo(100, 2);
  });

  it("falls back to the closest prior date when exact date is missing", () => {
    expect(
      getTransactionAmountInCurrency(
        "108",
        "USD",
        "EUR",
        "2024-06-05T00:00:00.000Z",
        ratesByDate,
      ),
    ).toBeCloseTo(100, 2);
  });

  it("returns the original amount when no rates are available", () => {
    expect(
      getTransactionAmountInCurrency(
        "50",
        "USD",
        "EUR",
        "2024-05-01T00:00:00.000Z",
        {},
      ),
    ).toBe(50);
  });
});
