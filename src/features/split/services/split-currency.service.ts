import { convertAmount } from "@/features/currency/services/conversion.service";
import { ExchangeRateService } from "@/features/currency/services/exchange-rate.service";
import type { Prisma } from "@prisma/client";
import type { ISplitMode } from "../utils/split-mode";
import {
  computeShares,
  convertShareAmountsToGroupCurrency,
  type IComputedShare,
} from "../utils/split-share-calculator";

export type IConversionResult = {
  groupAmount: string | null;
  conversionStatus: "pending" | "converted" | "failed";
  exchangeRateDate: Date | null;
  exchangeRate: string | null;
  shares: Array<IComputedShare & { shareGroupAmount: string | null }>;
};

export class SplitCurrencyService {
  static async convertExpense(
    params: {
      amount: string;
      currency: string;
      groupCurrency: string;
      expenseDate: Date;
      splitMode: ISplitMode;
      participantMemberIds: string[];
      payerMemberId: string;
      exactShares?: Array<{ memberId: string; shareAmount?: string }>;
    },
  ): Promise<IConversionResult> {
    const shares = computeShares(
      params.splitMode,
      params.amount,
      params.currency,
      params.participantMemberIds,
      params.payerMemberId,
      params.exactShares,
    );

    if (params.currency === params.groupCurrency) {
      const withGroup = shares.map((s) => ({
        ...s,
        shareGroupAmount: s.shareAmount,
      }));
      return {
        groupAmount: params.amount,
        conversionStatus: "converted",
        exchangeRateDate: params.expenseDate,
        exchangeRate: "1",
        shares: withGroup,
      };
    }

    const rates = await ExchangeRateService.getRatesForDate(params.expenseDate);
    if (!rates) {
      return {
        groupAmount: null,
        conversionStatus: "pending",
        exchangeRateDate: null,
        exchangeRate: null,
        shares: shares.map((s) => ({ ...s, shareGroupAmount: null })),
      };
    }

    const groupAmountNum = convertAmount(
      parseFloat(params.amount),
      params.currency,
      params.groupCurrency,
      rates.rates,
    );

    if (groupAmountNum == null) {
      return {
        groupAmount: null,
        conversionStatus: "pending",
        exchangeRateDate: null,
        exchangeRate: null,
        shares: shares.map((s) => ({ ...s, shareGroupAmount: null })),
      };
    }

    const groupAmount = groupAmountNum.toFixed(2);
    const rate =
      rates.rates[params.currency] != null && rates.rates[params.groupCurrency] != null
        ? (
            rates.rates[params.groupCurrency]! / rates.rates[params.currency]!
          ).toFixed(8)
        : null;

    const convertedShares = convertShareAmountsToGroupCurrency(
      shares,
      params.currency,
      params.groupCurrency,
      groupAmount,
      (amount, from, to) => convertAmount(amount, from, to, rates.rates),
    );

    return {
      groupAmount,
      conversionStatus: "converted",
      exchangeRateDate: new Date(`${rates.date}T00:00:00.000Z`),
      exchangeRate: rate,
      shares: convertedShares,
    };
  }

  static formatDecimalForDb(value: string | null): Prisma.Decimal | null {
    if (value == null) return null;
    return value as unknown as Prisma.Decimal;
  }
}
