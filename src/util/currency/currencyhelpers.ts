/**
 * Currency Helpers
 * Utility functions for formatting currency values using browser locale
 */

import type { ICurrency } from "@/features/shared/validation/schemas";

/**
 * Get the browser's locale
 * Falls back to "en-US" if detection fails
 */
function getBrowserLocale(): string {
  try {
    // Try to get locale from Intl API first (more reliable)
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      const resolved = Intl.DateTimeFormat().resolvedOptions().locale;
      if (resolved) {
        return resolved;
      }
    }
    // Fallback to navigator.language
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
  } catch (error) {
    // Silently fall back to default locale
  }
  // Default fallback
  return "en-US";
}

/**
 * Format amount with currency using browser locale
 * @param amount - Amount as string (e.g., "1234.56")
 * @param currency - Currency code (e.g., "USD", "EUR")
 * @returns Formatted currency string (e.g., "$1,234.56" or "1.234,56 €" depending on locale)
 */
export function formatCurrency(amount: string, currency: ICurrency): string {
  try {
    const numAmount = parseFloat(amount);

    // Handle invalid amounts
    if (isNaN(numAmount)) {
      return new Intl.NumberFormat(getBrowserLocale(), {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(0);
    }

    const locale = getBrowserLocale();

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  } catch (error) {
    // Fallback to en-US if formatting fails
    try {
      const numAmount = parseFloat(amount) || 0;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numAmount);
    } catch (fallbackError) {
      // Last resort: return raw amount with currency code
      return `${amount} ${currency}`;
    }
  }
}
