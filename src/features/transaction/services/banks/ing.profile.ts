import type { BankProfile } from "../bank.factory";

const VALIDATED_COLUMN_HINTS = {
  transactionDate: ["Date"],
  name: ["Name / Description"],
  amount: ["Amount (EUR)"],
  currency: [],
  type: ["Debit/credit"],
  description: ["Notifications"],
};

export const ingProfile: BankProfile = {
  columnHints: {
    transactionDate: [
      ...VALIDATED_COLUMN_HINTS.transactionDate,
      "Datum",
      "Boekingsdatum",
      "Date",
    ],
    name: [
      ...VALIDATED_COLUMN_HINTS.name,
      "Naam/Omschrijving",
      "Naam",
      "Omschrijving",
    ],
    amount: [
      ...VALIDATED_COLUMN_HINTS.amount,
      "Bedrag (EUR)",
      "Bedrag",
      "Amount",
    ],
    currency: [
      ...VALIDATED_COLUMN_HINTS.currency,
      "Munt",
      "Valuta",
      "Currency",
    ],
    type: [...VALIDATED_COLUMN_HINTS.type, "Af Bij", "Type"],
    description: [
      ...VALIDATED_COLUMN_HINTS.description,
      "Mededelingen",
      "Omschrijving",
    ],
  },
  // ING requires explicit type column mapping (cannot auto-detect from amount sign)
  requiredFields: ["type"],
  // ING is a Dutch bank, typically uses debit cards
  defaultPaymentMethod: "DEBIT_CARD",
};
