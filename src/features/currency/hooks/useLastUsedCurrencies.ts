import { isKnownCurrency } from "@/features/currency/config/currencies";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "financely:last-used-currencies";
const MAX_LAST_USED = 5;

function readLastUsed(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (value): value is string =>
        typeof value === "string" && isKnownCurrency(value),
    );
  } catch {
    return [];
  }
}

function writeLastUsed(currencies: string[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currencies));
}

export function useLastUsedCurrencies() {
  const [lastUsed, setLastUsed] = useState<string[]>(() => readLastUsed());

  useEffect(() => {
    setLastUsed(readLastUsed());
  }, []);

  const recordCurrencyUse = useCallback((currency: string) => {
    if (!isKnownCurrency(currency)) {
      return;
    }
    setLastUsed((prev) => {
      const next = [
        currency,
        ...prev.filter((code) => code !== currency),
      ].slice(0, MAX_LAST_USED);
      writeLastUsed(next);
      return next;
    });
  }, []);

  return { lastUsed, recordCurrencyUse };
}
