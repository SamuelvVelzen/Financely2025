import { describe, expect, it } from "vitest";
import { getSplitExpenseRecommendedCurrencies } from "./split-expense-currencies";

describe("getSplitExpenseRecommendedCurrencies", () => {
  it("puts group currency first", () => {
    expect(getSplitExpenseRecommendedCurrencies("EUR", [])).toEqual(["EUR"]);
  });

  it("adds expense currencies after group currency without duplicates", () => {
    expect(
      getSplitExpenseRecommendedCurrencies("EUR", [
        { currency: "EUR" },
        { currency: "MXN" },
        { currency: "EUR" },
      ]),
    ).toEqual(["EUR", "MXN"]);
  });

  it("preserves first-seen order for expense currencies", () => {
    expect(
      getSplitExpenseRecommendedCurrencies("EUR", [
        { currency: "MXN" },
        { currency: "USD" },
        { currency: "MXN" },
      ]),
    ).toEqual(["EUR", "MXN", "USD"]);
  });
});
