import type { BankEnum } from "../config/banks";
import type { ITransactionFieldName } from "../config/transaction-fields";
import { americanExpressProfile } from "./banks/american-express.profile";
import { ingProfile } from "./banks/ing.profile";
import { n26Profile } from "./banks/n26.profile";

type BankColumnHints = Partial<Record<ITransactionFieldName, string[]>>;

export interface BankProfile {
  columnHints: BankColumnHints;
}

const BANK_REGISTRY: Record<BankEnum, BankProfile> = {
  AMERICAN_EXPRESS: americanExpressProfile,
  ING: ingProfile,
  N26: n26Profile,
};

export class BankProfileFactory {
  static getProfile(bank?: BankEnum | null): BankProfile | undefined {
    if (!bank) {
      return undefined;
    }
    return BANK_REGISTRY[bank];
  }

  static getColumnHints(
    bank: BankEnum | null | undefined
  ): BankColumnHints | undefined {
    return this.getProfile(bank)?.columnHints;
  }
}
