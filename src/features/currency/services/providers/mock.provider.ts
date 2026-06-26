import type {
  IExchangeRateProvider,
  IRateResponse,
} from "./exchange-rate-provider.interface";
import {
  MOCK_BASE_CURRENCY,
  MOCK_RATES,
} from "./mock-rates.fixture";

function formatDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class MockProvider implements IExchangeRateProvider {
  getBaseCurrency(): string {
    return MOCK_BASE_CURRENCY;
  }

  supportsHistorical(): boolean {
    return true;
  }

  getName(): string {
    return "mock";
  }

  async getSupportedCurrencies(): Promise<string[]> {
    return Object.keys(MOCK_RATES);
  }

  async fetchRates(date: Date): Promise<IRateResponse> {
    return {
      date: formatDateParam(date),
      baseCurrency: MOCK_BASE_CURRENCY,
      rates: { ...MOCK_RATES },
    };
  }
}
