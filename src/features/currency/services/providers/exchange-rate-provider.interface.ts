export type IRateResponse = {
  date: string;
  baseCurrency: string;
  rates: Record<string, number>;
};

export interface IExchangeRateProvider {
  fetchRates(date: Date): Promise<IRateResponse>;
  getBaseCurrency(): string;
  supportsHistorical(): boolean;
  getSupportedCurrencies(): Promise<string[]>;
  getName(): string;
}
