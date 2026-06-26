import { z } from "zod";

export const ExchangeRateRecordSchema = z.object({
  currency: z.string(),
  rateToBase: z.number(),
  baseCurrency: z.string(),
  date: z.string(),
});

export const ExchangeRatesForDateSchema = z.object({
  date: z.string(),
  baseCurrency: z.string(),
  rates: z.record(z.string(), z.number()),
  stale: z.boolean().optional(),
  fallbackDate: z.string().optional(),
});

export const ExchangeRatesResponseSchema = z.object({
  ratesByDate: z.array(ExchangeRatesForDateSchema),
});

export const RefreshRatesResponseSchema = z.object({
  date: z.string(),
  baseCurrency: z.string(),
  count: z.number(),
});

export const WorkspaceCurrenciesResponseSchema = z.object({
  currencies: z.array(z.string()),
});

export type IExchangeRateRecord = z.infer<typeof ExchangeRateRecordSchema>;
export type IExchangeRatesForDate = z.infer<typeof ExchangeRatesForDateSchema>;
export type IExchangeRatesResponse = z.infer<typeof ExchangeRatesResponseSchema>;
export type IRefreshRatesResponse = z.infer<typeof RefreshRatesResponseSchema>;
export type IWorkspaceCurrenciesResponse = z.infer<
  typeof WorkspaceCurrenciesResponseSchema
>;
