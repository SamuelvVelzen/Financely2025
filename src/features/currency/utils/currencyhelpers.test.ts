import {
  getCurrencyAffixes,
  getCurrencyDisplay,
} from "@/features/currency/utils/currencyhelpers";
import { describe, expect, it } from "vitest";

describe("getCurrencyDisplay", () => {
  it("keeps symbol when Intl already has a distinctive glyph", () => {
    expect(getCurrencyDisplay("USD", "en-US")).toBe("symbol");
    expect(getCurrencyDisplay("VND", "en-US")).toBe("symbol");
  });

  it("falls back to narrowSymbol when symbol is just the ISO code", () => {
    expect(getCurrencyDisplay("LAK", "en-US")).toBe("narrowSymbol");
    expect(getCurrencyDisplay("NGN", "en-US")).toBe("narrowSymbol");
  });
});

describe("getCurrencyAffixes", () => {
  it("places USD as a prefix in en-US", () => {
    expect(getCurrencyAffixes("USD", "en-US")).toEqual({
      prefix: "$",
      suffix: "",
    });
  });

  it("places EUR as a suffix in de-DE", () => {
    const affixes = getCurrencyAffixes("EUR", "de-DE");
    expect(affixes.prefix).toBe("");
    expect(affixes.suffix).toContain("€");
  });

  it("places EUR as a prefix in nl-NL", () => {
    const affixes = getCurrencyAffixes("EUR", "nl-NL");
    expect(affixes.prefix).toContain("€");
    expect(affixes.suffix).toBe("");
  });

  it("uses a real glyph for LAK instead of the ISO code", () => {
    const affixes = getCurrencyAffixes("LAK", "en-US");
    expect(affixes.prefix + affixes.suffix).toContain("₭");
    expect(affixes.prefix + affixes.suffix).not.toContain("LAK");
  });
});
