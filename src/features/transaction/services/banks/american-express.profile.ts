import type { BankProfile } from "../bank.factory";

export const americanExpressProfile: BankProfile = {
  columnHints: {
    transactionDate: ["Date", "Date & Time", "Transaction Date"],
    name: ["Description", "Card Member", "Merchant"],
    amount: ["Amount", "Amount (USD)", "Amount (Original)"],
    currency: ["Currency", "Currency Code"],
    type: ["Card Member", "Type"],
    externalId: ["Reference", "Reference Number"],
  },
  // AMEX can auto-detect type from amount sign
  requiredFields: [],
  // American Express is a credit card company
  defaultPaymentMethod: "CREDIT_CARD",
};
