/**
 * Currency Configuration
 * Single source of truth for supported ISO 4217 currencies
 */

import isoCurrenciesData from "./iso-currencies.json";
import { type ISelectOption } from "@/features/ui/select/select";
import { type ISelectOptionGroup } from "@/features/ui/select/select-option-groups";

export type ICurrencyMetadata = {
  code: string;
  name: string;
  minorUnits: number;
};

const ISO_CURRENCIES = isoCurrenciesData as ICurrencyMetadata[];

const CURRENCY_BY_CODE = new Map(
  ISO_CURRENCIES.map((currency) => [currency.code, currency]),
);

/** All supported ISO 4217 currency codes */
export const SUPPORTED_CURRENCIES = ISO_CURRENCIES.map(
  (c) => c.code,
) as readonly string[];

export type ICurrency = string;

export function isKnownCurrency(value: string): value is ICurrency {
  return CURRENCY_BY_CODE.has(value);
}

export function getCurrencyMetadata(code: string): ICurrencyMetadata | undefined {
  return CURRENCY_BY_CODE.get(code);
}

export function getCurrencyMinorUnits(code: string): number {
  return getCurrencyMetadata(code)?.minorUnits ?? 2;
}

export function formatCurrencyLabel(code: string): string {
  const meta = getCurrencyMetadata(code);
  return meta ? `${code} — ${meta.name}` : code;
}

export function uniquePreserveOrder(
  values: Array<string | null | undefined>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value || seen.has(value) || !isKnownCurrency(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result;
}

export function getRecommendedCurrencies(input: {
  workspaceDefault?: string | null;
  browserCurrency: string;
  lastUsed: string[];
  workspaceCurrencies: string[];
  maxItems?: number;
}): string[] {
  return uniquePreserveOrder([
    input.workspaceDefault,
    input.browserCurrency,
    ...input.lastUsed,
    ...input.workspaceCurrencies,
  ]).slice(0, input.maxItems ?? 12);
}

export function getAllCurrencyOptions(): ISelectOption[] {
  return ISO_CURRENCIES.map((currency) => ({
    value: currency.code,
    label: formatCurrencyLabel(currency.code),
  }));
}

export function getCurrencyOptionsForCodes(codes: string[]): ISelectOption[] {
  return codes
    .filter(isKnownCurrency)
    .map((code) => ({
      value: code,
      label: formatCurrencyLabel(code),
    }));
}

export function buildCurrencySelectOptions(input: {
  workspaceDefault?: string | null;
  browserCurrency: string;
  lastUsed: string[];
  workspaceCurrencies: string[];
  searchQuery?: string;
}): {
  options: ISelectOptionGroup[];
  recommendedCount: number;
} {
  const search = input.searchQuery?.trim().toLowerCase() ?? "";

  if (search) {
    const filtered = ISO_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(search) ||
        c.name.toLowerCase().includes(search),
    ).map((c) => ({
      value: c.code,
      label: formatCurrencyLabel(c.code),
    }));
    return {
      options: [{ group: "", children: filtered }],
      recommendedCount: 0,
    };
  }

  const recommended = getRecommendedCurrencies({
    workspaceDefault: input.workspaceDefault,
    browserCurrency: input.browserCurrency,
    lastUsed: input.lastUsed,
    workspaceCurrencies: input.workspaceCurrencies,
  });

  const recommendedSet = new Set(recommended);
  const recommendedOptions = getCurrencyOptionsForCodes(recommended);
  const allOtherOptions = ISO_CURRENCIES.filter(
    (c) => !recommendedSet.has(c.code),
  ).map((c) => ({
    value: c.code,
    label: formatCurrencyLabel(c.code),
  }));

  return {
    options: [
      ...(recommendedOptions.length > 0
        ? [{ group: "Recommended", children: recommendedOptions }]
        : []),
      { group: "All currencies", children: allOtherOptions },
    ],
    recommendedCount: recommendedOptions.length,
  };
}

/**
 * @deprecated Use getAllCurrencyOptions — kept for backward compatibility
 */
export function getCurrencyOptions(): ISelectOption[] {
  return getAllCurrencyOptions();
}

export function getCurrencySearchValue(option: ISelectOption): string {
  const code = String(option.value);
  const meta = getCurrencyMetadata(code);
  return meta ? `${code} ${meta.name}` : code;
}
