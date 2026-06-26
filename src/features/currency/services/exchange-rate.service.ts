import {
  ExchangeRatesForDateSchema,
  type IExchangeRatesForDate,
} from "@/features/currency/validation/schemas";
import { prisma } from "@/features/util/prisma";
import { getExchangeRateProvider } from "./providers/provider.factory";

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function normalizeToUtcMidnight(date: Date): Date {
  return parseDateKey(toDateKey(date));
}

export class ExchangeRateService {
  static async fetchAndStoreRates(date: Date = new Date()): Promise<number> {
    const provider = getExchangeRateProvider();
    const normalizedDate = normalizeToUtcMidnight(date);
    const response = await provider.fetchRates(normalizedDate);
    const rateDate = parseDateKey(response.date);

    const operations = Object.entries(response.rates).map(([currency, rate]) =>
      prisma.exchangeRate.upsert({
        where: {
          currency_date_baseCurrency: {
            currency,
            date: rateDate,
            baseCurrency: response.baseCurrency,
          },
        },
        create: {
          currency,
          rateToBase: rate,
          baseCurrency: response.baseCurrency,
          date: rateDate,
        },
        update: {
          rateToBase: rate,
        },
      }),
    );

    await prisma.$transaction(operations);
    return operations.length;
  }

  static async ensureTodayRates(): Promise<void> {
    const today = normalizeToUtcMidnight(new Date());
    const existing = await prisma.exchangeRate.findFirst({
      where: { date: today },
    });
    if (!existing) {
      await this.fetchAndStoreRates(today);
    }
  }

  static async getRatesForDate(
    date: Date,
    options: { allowFetch?: boolean } = {},
  ): Promise<IExchangeRatesForDate | null> {
    const { allowFetch = true } = options;
    const normalizedDate = normalizeToUtcMidnight(date);
    const dateKey = toDateKey(normalizedDate);

    let dbRates = await prisma.exchangeRate.findMany({
      where: { date: normalizedDate },
    });

    let stale = false;
    let fallbackDate: string | undefined;

    if (dbRates.length === 0 && allowFetch) {
      try {
        await this.fetchAndStoreRates(normalizedDate);
        dbRates = await prisma.exchangeRate.findMany({
          where: { date: normalizedDate },
        });
      } catch {
        // fall through to closest prior date
      }
    }

    if (dbRates.length === 0) {
      const closest = await prisma.exchangeRate.findFirst({
        where: { date: { lt: normalizedDate } },
        orderBy: { date: "desc" },
      });
      if (!closest) {
        return null;
      }
      fallbackDate = toDateKey(closest.date);
      stale = true;
      dbRates = await prisma.exchangeRate.findMany({
        where: { date: closest.date },
      });
    }

    const rates: Record<string, number> = {};
    let baseCurrency = "EUR";
    for (const row of dbRates) {
      rates[row.currency] = row.rateToBase;
      baseCurrency = row.baseCurrency;
    }

    return ExchangeRatesForDateSchema.parse({
      date: fallbackDate ?? dateKey,
      baseCurrency,
      rates,
      ...(stale ? { stale: true, fallbackDate } : {}),
    });
  }

  static async getRatesForDates(
    dates: string[],
  ): Promise<IExchangeRatesForDate[]> {
    await this.ensureTodayRates();

    const uniqueDates = [...new Set(dates)].sort();
    const results: IExchangeRatesForDate[] = [];

    for (const dateKey of uniqueDates) {
      const rates = await this.getRatesForDate(parseDateKey(dateKey));
      if (rates) {
        results.push(rates);
      }
    }

    return results;
  }

  static getCrossRate(
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
}
