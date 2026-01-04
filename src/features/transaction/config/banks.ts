export const BANK_VALUES = [
  "DEFAULT",
  "AMERICAN_EXPRESS",
  "ING",
  "N26",
] as const;

export type BankEnum = (typeof BANK_VALUES)[number];

export const BANK_LABELS: Record<BankEnum, string> = {
  DEFAULT: "Default",
  AMERICAN_EXPRESS: "American Express",
  ING: "ING",
  N26: "N26",
};

export type BankOption = {
  value: BankEnum;
  label: string;
};

export const BANK_OPTIONS: readonly BankOption[] = BANK_VALUES.map((value) => ({
  value,
  label: BANK_LABELS[value],
}));

export const DEFAULT_BANK_OPTION_PLACEHOLDER = "Select a bank";

