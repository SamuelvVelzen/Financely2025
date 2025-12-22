/**
 * Currency Helpers
 * Utility functions for formatting currency values using browser locale
 */

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

/**
 * Format amount with currency using browser locale
 * @param amount - Amount as string (e.g., "1234.56")
 * @param currency - Currency code (e.g., "USD", "EUR")
 * @returns Formatted currency string (e.g., "$1,234.56" or "1.234,56 €" depending on locale)
 */
export function formatCurrency(amount: string, currency: string): string {
  try {
    const numAmount = parseFloat(amount);

    // Handle invalid amounts
    if (isNaN(numAmount)) {
      return new Intl.NumberFormat(LocaleHelpers.getLocale(), {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(0);
    }

    const locale = LocaleHelpers.getLocale();

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  } catch (err) {
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
