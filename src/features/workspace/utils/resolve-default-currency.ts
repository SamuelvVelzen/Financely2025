import type { ICurrency } from "@/features/currency/config/currencies";
import type { IWorkspaceSetting } from "@/features/shared/validation/schemas";
import { getBrowserCurrency } from "@/features/users/utils/browser-defaults";

const APP_FALLBACK_CURRENCY: ICurrency = "EUR";

export function resolveDefaultCurrencyFromSetting(
  setting: IWorkspaceSetting | null | undefined,
): ICurrency {
  if (setting?.defaultCurrency) {
    return setting.defaultCurrency;
  }
  return getBrowserCurrency() ?? APP_FALLBACK_CURRENCY;
}
