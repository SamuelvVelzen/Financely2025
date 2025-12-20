import type { BankProfile } from "../bank.factory";

export const n26Profile: BankProfile = {
  columnHints: {
    occurredAt: ["Date", "Booking date"],
    name: ["Payee", "Transaction Description"],
    amount: ["Amount (EUR)", "Amount"],
    currency: ["Currency"],
    type: ["Transaction Type", "Type"],
    notes: ["Reference", "Notes"],
  },
  // N26 can auto-detect type from amount sign
  requiredFields: [],
};
