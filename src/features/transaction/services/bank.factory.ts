import type { BankEnum } from "../config/banks";
import type { IPaymentMethod } from "../config/payment-methods";
import type { ITransactionFieldName } from "../config/transaction-fields";
import { americanExpressProfile } from "./banks/american-express.profile";
import { defaultProfile } from "./banks/default.profile";
import { ingProfile } from "./banks/ing.profile";
import { n26Profile } from "./banks/n26.profile";

type BankColumnHints = Partial<Record<ITransactionFieldName, string[]>>;

export interface BankProfile {
  columnHints: BankColumnHints;
  /** Fields that MUST be mapped for this bank (cannot be auto-detected) */
  requiredFields: ITransactionFieldName[];
  /** Default payment method to use when importing CSV if paymentMethod is not mapped */
  defaultPaymentMethod: IPaymentMethod;
  /** Optional function to detect if filename matches this bank's pattern */
  detectBankByFilename?: (filename: string) => boolean;
}

const BANK_REGISTRY: Record<BankEnum, BankProfile> = {
  DEFAULT: defaultProfile,
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

  static getRequiredFields(
    bank: BankEnum | null | undefined
  ): ITransactionFieldName[] {
    return this.getProfile(bank)?.requiredFields ?? [];
  }

  static getDefaultPaymentMethod(
    bank: BankEnum | null | undefined
  ): IPaymentMethod {
    return this.getProfile(bank)?.defaultPaymentMethod ?? "DEBIT_CARD";
  }

  static detectBankByFilename(filename: string): BankEnum | null {
    // Check all banks except DEFAULT
    for (const [bank, profile] of Object.entries(BANK_REGISTRY)) {
      if (bank === "DEFAULT") continue;
      if (profile.detectBankByFilename?.(filename)) {
        return bank as BankEnum;
      }
    }
    return null;
  }
}
