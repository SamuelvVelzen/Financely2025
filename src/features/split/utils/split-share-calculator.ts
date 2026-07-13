import { getCurrencyMinorUnits } from "@/features/currency/config/currencies";

export type ISplitShareInput = {
  memberId: string;
  shareAmount?: string;
};

export type IComputedShare = {
  memberId: string;
  shareAmount: string;
};

function toMinorUnits(amount: number, currency: string): number {
  const minor = getCurrencyMinorUnits(currency);
  const factor = 10 ** minor;
  return Math.round(amount * factor);
}

function fromMinorUnits(minor: number, currency: string): string {
  const minorUnits = getCurrencyMinorUnits(currency);
  const factor = 10 ** minorUnits;
  return (minor / factor).toFixed(minorUnits);
}

export function computeEqualShares(
  totalAmount: string,
  currency: string,
  participantMemberIds: string[],
  payerMemberId: string,
): IComputedShare[] {
  if (participantMemberIds.length === 0) {
    return [];
  }

  const totalMinor = toMinorUnits(parseFloat(totalAmount), currency);
  const baseShare = Math.floor(totalMinor / participantMemberIds.length);
  const remainder = totalMinor - baseShare * participantMemberIds.length;

  return participantMemberIds.map((memberId) => {
    const extra = memberId === payerMemberId ? remainder : 0;
    return {
      memberId,
      shareAmount: fromMinorUnits(baseShare + extra, currency),
    };
  });
}

export function computeExactShares(
  totalAmount: string,
  currency: string,
  shares: ISplitShareInput[],
): IComputedShare[] {
  const totalMinor = toMinorUnits(parseFloat(totalAmount), currency);
  const computed = shares.map((s) => ({
    memberId: s.memberId,
    shareAmount: s.shareAmount ?? "0",
  }));

  const sumMinor = computed.reduce(
    (acc, s) => acc + toMinorUnits(parseFloat(s.shareAmount), currency),
    0,
  );

  if (sumMinor !== totalMinor) {
    throw new Error("Share amounts must sum to the expense total");
  }

  return computed;
}

export function computeShares(
  splitMode: "equal" | "exact",
  totalAmount: string,
  currency: string,
  participantMemberIds: string[],
  payerMemberId: string,
  exactShares?: ISplitShareInput[],
): IComputedShare[] {
  if (splitMode === "exact") {
    if (!exactShares?.length) {
      throw new Error("Exact split requires share amounts");
    }
    return computeExactShares(totalAmount, currency, exactShares);
  }
  return computeEqualShares(
    totalAmount,
    currency,
    participantMemberIds,
    payerMemberId,
  );
}

export function convertShareAmountsToGroupCurrency(
  shares: IComputedShare[],
  expenseCurrency: string,
  groupCurrency: string,
  groupAmount: string,
  convert: (amount: number, from: string, to: string) => number | null,
): Array<IComputedShare & { shareGroupAmount: string | null }> {
  if (expenseCurrency === groupCurrency) {
    return shares.map((s) => ({
      ...s,
      shareGroupAmount: s.shareAmount,
    }));
  }

  const converted = shares.map((s) => {
    const groupVal = convert(
      parseFloat(s.shareAmount),
      expenseCurrency,
      groupCurrency,
    );
    return {
      ...s,
      shareGroupAmount:
        groupVal != null ? groupVal.toFixed(getCurrencyMinorUnits(groupCurrency)) : null,
    };
  });

  const totalGroupMinor = toMinorUnits(parseFloat(groupAmount), groupCurrency);
  const sumMinor = converted.reduce((acc, s) => {
    if (s.shareGroupAmount == null) return acc;
    return acc + toMinorUnits(parseFloat(s.shareGroupAmount), groupCurrency);
  }, 0);

  if (sumMinor !== totalGroupMinor && converted.every((s) => s.shareGroupAmount != null)) {
    const diff = totalGroupMinor - sumMinor;
    if (diff !== 0 && converted.length > 0) {
      const last = converted[converted.length - 1]!;
      const adjusted =
        toMinorUnits(parseFloat(last.shareGroupAmount!), groupCurrency) + diff;
      last.shareGroupAmount = fromMinorUnits(adjusted, groupCurrency);
    }
  }

  return converted;
}
