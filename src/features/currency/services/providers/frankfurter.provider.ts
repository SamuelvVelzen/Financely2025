import type {
  IExchangeRateProvider,
  IRateResponse,
} from "./exchange-rate-provider.interface";

const FRANKFURTER_BASE_URL = "https://api.frankfurter.dev/v2";
const BASE_CURRENCY = "EUR";

function formatDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class FrankfurterProvider implements IExchangeRateProvider {
  getBaseCurrency(): string {
    return BASE_CURRENCY;
  }

  supportsHistorical(): boolean {
    return true;
  }

  getName(): string {
    return "frankfurter";
  }

  async getSupportedCurrencies(): Promise<string[]> {
    const response = await fetch(`${FRANKFURTER_BASE_URL}/currencies`);
    if (!response.ok) {
      throw new Error(`Frankfurter currencies request failed: ${response.status}`);
    }
    const data = (await response.json()) as Array<{ iso_code: string }>;
    return data.map((c) => c.iso_code);
  }

  async fetchRates(date: Date): Promise<IRateResponse> {
    const dateParam = formatDateParam(date);
    const today = formatDateParam(new Date());
    const path =
      dateParam === today ? `${FRANKFURTER_BASE_URL}/latest` : `${FRANKFURTER_BASE_URL}/${dateParam}`;

    const url = new URL(path);
    url.searchParams.set("from", BASE_CURRENCY);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Frankfurter rates request failed for ${dateParam}: ${response.status}`,
      );
    }

    const data = (await response.json()) as {
      amount: number;
      base: string;
      date: string;
      rates: Record<string, number>;
    };

    return {
      date: data.date,
      baseCurrency: data.base,
      rates: { [BASE_CURRENCY]: 1, ...data.rates },
    };
  }
}
