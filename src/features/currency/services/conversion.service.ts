import { getCurrencyMinorUnits } from "@/features/currency/config/currencies";
import type { IExchangeRatesForDate } from "@/features/currency/validation/schemas";

export type IRatesByDate = Record<string, IExchangeRatesForDate>;

function findRatesForDate(
  ratesByDate: IRatesByDate,
  dateKey: string,
): IExchangeRatesForDate | undefined {
  if (ratesByDate[dateKey]) {
    return ratesByDate[dateKey];
  }
  const sortedKeys = Object.keys(ratesByDate).sort();
  for (let i = sortedKeys.length - 1; i >= 0; i--) {
    if (sortedKeys[i] <= dateKey) {
      return ratesByDate[sortedKeys[i]];
    }
  }
  return sortedKeys.length > 0 ? ratesByDate[sortedKeys[0]] : undefined;
}

export function getConversionRate(
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number | null {
  if (fromCurrency === toCurrency) {
    return 1;
  }
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];
  if (fromRate == null || toRate == null || fromRate === 0) {
    return null;
  }
  return toRate / fromRate;
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number | null {
  const rate = getConversionRate(fromCurrency, toCurrency, rates);
  if (rate == null) {
    return null;
  }
  const minorUnits = getCurrencyMinorUnits(toCurrency);
  const factor = 10 ** minorUnits;
  return Math.round(amount * rate * factor) / factor;
}

export function buildRatesByDateMap(
  ratesForDates: IExchangeRatesForDate[],
): IRatesByDate {
  return Object.fromEntries(
    ratesForDates.map((entry) => [entry.date, entry]),
  );
}

export function extractUniqueTransactionDates(
  transactions: Array<{ transactionDate: string }>,
): string[] {
  return [
    ...new Set(transactions.map((tx) => tx.transactionDate.slice(0, 10))),
  ];
}

export function getTransactionAmountInCurrency(
  amount: string,
  fromCurrency: string,
  toCurrency: string,
  transactionDate: string,
  ratesByDate: IRatesByDate,
): number {
  const numericAmount = parseFloat(amount);
  if (fromCurrency === toCurrency) {
    return numericAmount;
  }

  const rateEntry = findRatesForDate(
    ratesByDate,
    transactionDate.slice(0, 10),
  );
  if (!rateEntry) {
    return numericAmount;
  }

  return (
    convertAmount(
      numericAmount,
      fromCurrency,
      toCurrency,
      rateEntry.rates,
    ) ?? numericAmount
  );
}
