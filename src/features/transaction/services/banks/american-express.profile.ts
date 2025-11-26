import type { BankProfile } from "../bank.factory";

export const americanExpressProfile: BankProfile = {
  propertyOrder: "Date,Description,Amount,Currency,Type",
  columnHints: {
    occurredAt: ["Date", "Date & Time", "Transaction Date"],
    name: ["Description", "Card Member", "Merchant"],
    amount: ["Amount", "Amount (USD)", "Amount (Original)"],
    currency: ["Currency", "Currency Code"],
    type: ["Card Member", "Type"],
    externalId: ["Reference", "Reference Number"],
  },
};
