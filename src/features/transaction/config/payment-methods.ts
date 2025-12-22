/**
 * Payment Method Configuration
 * Single source of truth for supported payment methods in the application
 *
 * To add new payment methods, simply update PAYMENT_METHOD_VALUES and PAYMENT_METHOD_LABELS
 * No database migration needed!
 */

export const PAYMENT_METHOD_VALUES = [
  "CASH",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "BANK_TRANSFER",
  "CHECK",
  "DIGITAL_WALLET",
  "CRYPTOCURRENCY",
  "GIFT_CARD",
  "OTHER",
] as const;

export type IPaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export const PAYMENT_METHOD_LABELS: Record<IPaymentMethod, string> = {
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  BANK_TRANSFER: "Bank Transfer",
  CHECK: "Check",
  DIGITAL_WALLET: "Digital Wallet",
  CRYPTOCURRENCY: "Cryptocurrency",
  GIFT_CARD: "Gift Card",
  OTHER: "Other",
};

export type IPaymentMethodOption = {
  value: IPaymentMethod;
  label: string;
};

export const PAYMENT_METHOD_OPTIONS: readonly IPaymentMethodOption[] =
  PAYMENT_METHOD_VALUES.map((value) => ({
    value,
    label: PAYMENT_METHOD_LABELS[value],
  }));
