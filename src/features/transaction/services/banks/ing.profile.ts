import { ITransactionFieldName } from "../../config/transaction-fields";
import type { BankProfile } from "../bank.factory";

const VALIDATED_COLUMN_HINTS: Record<ITransactionFieldName, string[]> = {
  transactionDate: ["Date"],
  name: ["Name / Description"],
  amount: ["Amount (EUR)"],
  currency: [],
  type: ["Debit/credit"],
  description: ["Notifications"],
  notes: [],
  externalId: [],
  paymentMethod: [],
  tags: [],
  primaryTag: ["Tag"],
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
    primaryTag: ["Tag", "tag", "Primary Tag", "primary tag", "primarytag"],
  },
  // ING requires explicit type column mapping (cannot auto-detect from amount sign)
  requiredFields: ["type"],
  // ING is a Dutch bank, typically uses debit cards
  defaultPaymentMethod: "DEBIT_CARD",
};
