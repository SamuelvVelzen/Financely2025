import type { BankProfile } from "../bank.factory";

/**
 * Default bank profile for structured CSV template
 * Uses exact field names as column hints for precise matching
 */
export const defaultProfile: BankProfile = {
  columnHints: {
    type: ["Type"],
    amount: ["Amount"],
    currency: ["Currency"],
    transactionDate: ["Transaction Date"],
    name: ["Name"],
    paymentMethod: ["Payment Method"],
    description: ["Description"],
    notes: ["Notes"],
    externalId: ["External ID"],
    tags: ["Tags"],
    primaryTag: ["Primary Tag"],
  },
  // No bank-specific required fields
  requiredFields: [],
  // Default payment method
  defaultPaymentMethod: "DEBIT_CARD",
};
