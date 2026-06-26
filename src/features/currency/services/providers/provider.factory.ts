import type { IExchangeRateProvider } from "./exchange-rate-provider.interface";
import { FrankfurterProvider } from "./frankfurter.provider";
import { MockProvider } from "./mock.provider";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

let cachedProvider: IExchangeRateProvider | null = null;

export function getExchangeRateProvider(): IExchangeRateProvider {
  if (!cachedProvider) {
    cachedProvider = isProduction()
      ? new FrankfurterProvider()
      : new MockProvider();
  }
  return cachedProvider;
}

/** @internal Reset for tests */
export function resetExchangeRateProviderForTests(): void {
  cachedProvider = null;
}
