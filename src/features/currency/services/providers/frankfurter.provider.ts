import type {
  IExchangeRateProvider,
  IRateResponse,
} from "./exchange-rate-provider.interface";

const FRANKFURTER_BASE_URL = "https://api.frankfurter.dev/v2";
const FRANKFURTER_V1_BASE_URL = "https://api.frankfurter.app";
const BASE_CURRENCY = "EUR";

function formatDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type IFrankfurterCurrencyRow = {
  iso_code: string;
  type?: string;
};

type IFrankfurterRateRow = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

function parseRatesFromV2Rows(
  rows: IFrankfurterRateRow[],
  expectedBase: string,
): IRateResponse {
  const rates: Record<string, number> = { [expectedBase]: 1 };
  let date = formatDateParam(new Date());

  for (const row of rows) {
    if (row.base !== expectedBase) {
      continue;
    }
    date = row.date;
    rates[row.quote] = row.rate;
  }

  return {
    date,
    baseCurrency: expectedBase,
    rates,
  };
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
    const data = (await response.json()) as IFrankfurterCurrencyRow[];
    return data
      .filter((c) => c.type === "currency" || c.type == null)
      .map((c) => c.iso_code);
  }

  async fetchRates(date: Date): Promise<IRateResponse> {
    const dateParam = formatDateParam(date);
    const today = formatDateParam(new Date());
    const useLatest = dateParam === today;

    const url = new URL(`${FRANKFURTER_BASE_URL}/rates`);
    url.searchParams.set("base", BASE_CURRENCY);
    if (!useLatest) {
      url.searchParams.set("date", dateParam);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      try {
        return await this.fetchRatesV1Fallback(date);
      } catch {
        throw new Error(
          `Frankfurter rates request failed for ${dateParam}: ${response.status}`,
        );
      }
    }

    const data = (await response.json()) as IFrankfurterRateRow[];
    return parseRatesFromV2Rows(data, BASE_CURRENCY);
  }

  private async fetchRatesV1Fallback(date: Date): Promise<IRateResponse> {
    const dateParam = formatDateParam(date);
    const today = formatDateParam(new Date());
    const path =
      dateParam === today
        ? `${FRANKFURTER_V1_BASE_URL}/latest`
        : `${FRANKFURTER_V1_BASE_URL}/${dateParam}`;

    const url = new URL(path);
    url.searchParams.set("from", BASE_CURRENCY);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Frankfurter v1 fallback failed for ${dateParam}: ${response.status}`,
      );
    }

    const data = (await response.json()) as {
      date: string;
      base: string;
      rates: Record<string, number>;
    };

    return {
      date: data.date,
      baseCurrency: data.base,
      rates: { [BASE_CURRENCY]: 1, ...data.rates },
    };
  }
}
