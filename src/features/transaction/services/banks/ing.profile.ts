import type { BankProfile } from "../bank.factory";

export const ingProfile: BankProfile = {
  propertyOrder: "Datum,Naam/Omschrijving,Rekening,Tegenrekening,CODE",
  columnHints: {
    occurredAt: ["Datum", "Boekingsdatum", "Date"],
    name: ["Naam/Omschrijving", "Naam", "Omschrijving"],
    amount: ["Bedrag (EUR)", "Bedrag", "Amount"],
    currency: ["Munt", "Valuta", "Currency"],
    type: ["Af Bij", "Type"],
    description: ["Mededelingen", "Omschrijving"],
  },
};
