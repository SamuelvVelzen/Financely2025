import type { BankProfile } from "../bank.factory";

const VALIDATED_COLUMN_HINTS = {
  occurredAt: ["Date"],
  name: ["Name / Description"],
  amount: ["Amount (EUR)"],
  currency: [],
  type: ["Debit/credit"],
  description: ["Notifications"],
};

export const ingProfile: BankProfile = {
  columnHints: {
    occurredAt: [
      ...VALIDATED_COLUMN_HINTS.occurredAt,
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
};
