import type { BankProfile } from "../bank.factory";

export const n26Profile: BankProfile = {
  propertyOrder: "Date,Payee,Account Number,Transaction Type,Amount (EUR)",
  columnHints: {
    occurredAt: ["Date", "Booking date"],
    name: ["Payee", "Transaction Description"],
    amount: ["Amount (EUR)", "Amount"],
    currency: ["Currency"],
    type: ["Transaction Type", "Type"],
    notes: ["Reference", "Notes"],
  },
};
