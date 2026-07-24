/**
 * Currency Helpers
 * Utility functions for formatting currency values using browser locale
 */

import { getCurrencyMinorUnits } from "@/features/currency/config/currencies";
import { LocaleHelpers } from "@/features/util/locale.helpers";

const DEFAULT_FRACTION_DIGITS = 2;

type DecimalFormatOptions = {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

type ParseDecimalOptions = {
  locale?: string;
  fractionDigits?: number;
};

export type LocaleSeparators = {
  decimal: string;
  group: string;
};

export type CurrencyDisplay = "symbol" | "narrowSymbol";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function coerceNumber(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCurrencyPart(
  currency: string,
  locale: string,
  currencyDisplay: CurrencyDisplay
): string | undefined {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay,
  })
    .formatToParts(1)
    .find((part) => part.type === "currency")?.value;
}

/**
 * Prefer a distinctive glyph. ICU often returns the ISO code for `symbol`
 * (e.g. LAK, NGN); `narrowSymbol` usually has the real sign (₭, ₦).
 */
export function getCurrencyDisplay(
  currency: string,
  locale?: string
): CurrencyDisplay {
  const resolvedLocale = locale ?? LocaleHelpers.getLocale();

  try {
    const symbol = getCurrencyPart(currency, resolvedLocale, "symbol");
    if (symbol && symbol !== currency) {
      return "symbol";
    }

    const narrow = getCurrencyPart(currency, resolvedLocale, "narrowSymbol");
    if (narrow && narrow !== currency) {
      return "narrowSymbol";
    }
  } catch {
    // Invalid currency code — fall through.
  }

  return "symbol";
}

export function getLocaleSeparators(locale: string): LocaleSeparators {
  const formatter = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: DEFAULT_FRACTION_DIGITS,
    maximumFractionDigits: DEFAULT_FRACTION_DIGITS,
  });

  const parts = formatter.formatToParts(12345.6);
  const decimal = parts.find((part) => part.type === "decimal")?.value ?? ".";
  const group = parts.find((part) => part.type === "group")?.value ?? ",";

  return { decimal, group };
}

export function getDecimalSeparator(locale?: string): string {
  const resolvedLocale = locale ?? LocaleHelpers.getLocale();
  return getLocaleSeparators(resolvedLocale).decimal;
}

export type CurrencyAffixes = {
  prefix: string;
  suffix: string;
};

/**
 * Locale-aware currency symbol placement for inputs (e.g. "$" prefix vs " €" suffix).
 */
export function getCurrencyAffixes(
  currency: string,
  locale?: string
): CurrencyAffixes {
  const resolvedLocale = locale ?? LocaleHelpers.getLocale();

  try {
    const parts = new Intl.NumberFormat(resolvedLocale, {
      style: "currency",
      currency,
      currencyDisplay: getCurrencyDisplay(currency, resolvedLocale),
    }).formatToParts(1234.5);

    const currencyIndex = parts.findIndex((part) => part.type === "currency");
    if (currencyIndex === -1) {
      return { prefix: "", suffix: ` ${currency}` };
    }

    const firstNumberIndex = parts.findIndex(
      (part) =>
        part.type === "integer" ||
        part.type === "minusSign" ||
        part.type === "decimal"
    );

    if (firstNumberIndex === -1) {
      return { prefix: "", suffix: ` ${currency}` };
    }

    if (currencyIndex < firstNumberIndex) {
      return {
        prefix: parts
          .slice(0, firstNumberIndex)
          .map((part) => part.value)
          .join(""),
        suffix: "",
      };
    }

    let lastNumberIndex = firstNumberIndex;
    for (let i = parts.length - 1; i >= 0; i--) {
      const type = parts[i]?.type;
      if (
        type === "fraction" ||
        type === "integer" ||
        type === "decimal" ||
        type === "group"
      ) {
        lastNumberIndex = i;
        break;
      }
    }

    return {
      prefix: "",
      suffix: parts
        .slice(lastNumberIndex + 1)
        .map((part) => part.value)
        .join(""),
    };
  } catch {
    return { prefix: "", suffix: ` ${currency}` };
  }
}

function getCurrencyNumberFormat(
  currency: string,
  locale: string,
  fractionDigits: { min: number; max: number }
): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: getCurrencyDisplay(currency, locale),
    minimumFractionDigits: fractionDigits.min,
    maximumFractionDigits: fractionDigits.max,
  });
}

/**
 * Format amount with currency using browser locale
 * @param amount - Amount as string (e.g., "1234.56")
 * @param currency - Currency code (e.g., "USD", "EUR")
 * @returns Formatted currency string (e.g., "$1,234.56" or "1.234,56 €" depending on locale)
 */
export function formatCurrency(amount: string, currency: string): string {
  try {
    const numAmount = parseFloat(amount);
    const minorUnits = getCurrencyMinorUnits(currency);
    const locale = LocaleHelpers.getLocale();
    const formatter = getCurrencyNumberFormat(currency, locale, {
      min: minorUnits,
      max: minorUnits,
    });

    if (isNaN(numAmount)) {
      return formatter.format(0);
    }

    return formatter.format(numAmount);
  } catch (_err) {
    return `${amount} ${currency}`;
  }
}

export function formatDecimal(
  value: string | number | null | undefined,
  options: DecimalFormatOptions = {}
): string {
  const numberValue = coerceNumber(value);
  if (numberValue === null) {
    return "";
  }

  const {
    locale = LocaleHelpers.getLocale(),
    minimumFractionDigits = DEFAULT_FRACTION_DIGITS,
    maximumFractionDigits = DEFAULT_FRACTION_DIGITS,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping: true,
  }).format(numberValue);
}

export function parseLocalizedDecimal(
  value: string,
  options: ParseDecimalOptions = {}
): string {
  if (!value || !value.trim()) {
    return "";
  }

  const locale = options.locale ?? LocaleHelpers.getLocale();
  const fractionDigits = options.fractionDigits ?? DEFAULT_FRACTION_DIGITS;
  const { decimal, group } = getLocaleSeparators(locale);

  let normalized = value
    .replace(/\s|\u00A0/g, "")
    .replace(new RegExp(escapeRegExp(group), "g"), "");

  if (decimal !== ".") {
    normalized = normalized.replace(
      new RegExp(escapeRegExp(decimal), "g"),
      "."
    );
  }

  normalized = normalized.replace(/[^0-9.-]/g, "");

  const minusCount = (normalized.match(/-/g) ?? []).length;
  if (minusCount > 1) {
    normalized = normalized.replace(/-/g, "");
  }
  if (normalized.includes("-") && normalized[0] !== "-") {
    normalized = `-${normalized.replace(/-/g, "")}`;
  }

  const decimalCount = (normalized.match(/\./g) ?? []).length;
  if (decimalCount > 1) {
    const firstDecimalIndex = normalized.indexOf(".");
    normalized =
      normalized.slice(0, firstDecimalIndex + 1) +
      normalized.slice(firstDecimalIndex + 1).replace(/\./g, "");
  }

  const numericValue = Number(normalized);
  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return numericValue.toFixed(fractionDigits);
}
