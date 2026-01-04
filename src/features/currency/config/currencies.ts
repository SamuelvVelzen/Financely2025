/**
 * Currency Configuration
 * Single source of truth for supported currencies in the application
 */

import { ISelectOption } from "@/features/ui/select/select";

/**
 * Supported currencies array
 * Add or remove currencies here - no database migration needed!
 */
export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
] as const;

/**
 * Currency type derived from supported currencies
 */
export type ICurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Get currency options for select inputs
 * Returns formatted options array for UI components
 */
export function getCurrencyOptions(): ISelectOption[] {
  return SUPPORTED_CURRENCIES.map((value) => ({
    value,
    label: value,
  }));
}
