import { describe, expect, it } from "vitest";
import {
  buildCurrencySelectOptions,
  formatCurrencyLabel,
  getCurrencySearchValue,
  getRecommendedCurrencies,
  isKnownCurrency,
  uniquePreserveOrder,
} from "./currencies";

describe("isKnownCurrency", () => {
  it("accepts supported ISO codes", () => {
    expect(isKnownCurrency("EUR")).toBe(true);
    expect(isKnownCurrency("USD")).toBe(true);
  });

  it("rejects unknown codes", () => {
    expect(isKnownCurrency("XYZ")).toBe(false);
    expect(isKnownCurrency("")).toBe(false);
  });
});

describe("formatCurrencyLabel", () => {
  it("formats known currencies as code and name", () => {
    expect(formatCurrencyLabel("EUR")).toBe("EUR — Euro");
  });

  it("returns the code for unknown currencies", () => {
    expect(formatCurrencyLabel("XYZ")).toBe("XYZ");
  });
});

describe("uniquePreserveOrder", () => {
  it("removes duplicates while preserving first-seen order", () => {
    expect(
      uniquePreserveOrder(["EUR", "USD", "EUR", null, "USD", "GBP"]),
    ).toEqual(["EUR", "USD", "GBP"]);
  });

  it("filters unknown and empty values", () => {
    expect(uniquePreserveOrder(["", null, undefined, "XYZ", "EUR"])).toEqual([
      "EUR",
    ]);
  });
});

describe("getRecommendedCurrencies", () => {
  it("prioritizes workspace default, browser, last used, then workspace currencies", () => {
    expect(
      getRecommendedCurrencies({
        workspaceDefault: "EUR",
        browserCurrency: "USD",
        lastUsed: ["GBP", "EUR"],
        workspaceCurrencies: ["CHF", "USD"],
        maxItems: 4,
      }),
    ).toEqual(["EUR", "USD", "GBP", "CHF"]);
  });

  it("limits the number of recommendations", () => {
    expect(
      getRecommendedCurrencies({
        workspaceDefault: "EUR",
        browserCurrency: "USD",
        lastUsed: ["GBP", "CHF", "CAD"],
        workspaceCurrencies: ["AUD"],
        maxItems: 3,
      }),
    ).toEqual(["EUR", "USD", "GBP"]);
  });
});

describe("buildCurrencySelectOptions", () => {
  it("places recommended currencies before the rest when not searching", () => {
    const { options, recommendedCount } = buildCurrencySelectOptions({
      workspaceDefault: "EUR",
      browserCurrency: "USD",
      lastUsed: [],
      workspaceCurrencies: [],
    });

    expect(recommendedCount).toBe(2);
    expect(
      options
        .flatMap((optionGroup) => optionGroup.children)
        .slice(0, 2)
        .map((option) => option.value),
    ).toEqual(["EUR", "USD"]);
    expect(
      options
        .flatMap((optionGroup) => optionGroup.children)
        .some((option) => option.value === "AFN"),
    ).toBe(true);
  });

  it("filters all currencies when searching", () => {
    const { options, recommendedCount } = buildCurrencySelectOptions({
      workspaceDefault: "EUR",
      browserCurrency: "USD",
      lastUsed: [],
      workspaceCurrencies: [],
      searchQuery: "euro",
    });

    expect(recommendedCount).toBe(0);
    expect(
      options.flatMap((optionGroup) => optionGroup.children).map((option) => option.value),
    ).toEqual(["EUR"]);
  });
});

describe("getCurrencySearchValue", () => {
  it("includes code and currency name for known currencies", () => {
    expect(
      getCurrencySearchValue({ value: "EUR", label: "EUR — Euro" }),
    ).toContain("Euro");
    expect(
      getCurrencySearchValue({ value: "EUR", label: "EUR — Euro" }),
    ).toContain("EUR");
  });
});
