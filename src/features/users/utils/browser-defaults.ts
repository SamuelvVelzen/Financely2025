import type { ICurrency } from "@/features/currency/config/currencies";
import { SUPPORTED_CURRENCIES } from "@/features/currency/config/currencies";

const LOCALE_CURRENCY_MAP: Record<string, ICurrency> = {
  "en-US": "USD",
  "en-GB": "GBP",
  "en-CA": "CAD",
  "en-AU": "AUD",
  "nl-NL": "EUR",
  "nl-BE": "EUR",
  "de-DE": "EUR",
  "de-AT": "EUR",
  "fr-FR": "EUR",
  "ja-JP": "JPY",
};

const DEFAULT_LANGUAGE = "nl-NL";
const DEFAULT_CURRENCY: ICurrency = "EUR";

export function getBrowserLanguage(): string {
  try {
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      const resolved = Intl.DateTimeFormat().resolvedOptions().locale;
      if (resolved) {
        return resolved;
      }
    }
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language || navigator.languages?.[0] || DEFAULT_LANGUAGE;
    }
  } catch {
    // fall through
  }
  return DEFAULT_LANGUAGE;
}

export function getBrowserCurrency(): ICurrency {
  const locale = getBrowserLanguage();
  const direct = LOCALE_CURRENCY_MAP[locale];
  if (direct) {
    return direct;
  }
  const language = locale.split("-")[0] ?? "";
  const byLanguage = LOCALE_CURRENCY_MAP[language];
  if (byLanguage) {
    return byLanguage;
  }
  if (language === "en") {
    return "USD";
  }
  return DEFAULT_CURRENCY;
}

export function isSupportedCurrency(value: string): value is ICurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}
