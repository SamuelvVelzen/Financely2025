import { getCurrencyMinorUnits } from "@/features/currency/config/currencies";
import type { ISplitMode } from "@/features/split/utils/split-mode";

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

function parseNonNegative(value: string | undefined): number {
  const parsed = parseFloat(value ?? "0");
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

/** Distribute totalMinor across weights; leftover cents go to remainderMemberId. */
function distributeByWeights(
  totalMinor: number,
  currency: string,
  weights: Array<{ memberId: string; weight: number }>,
  remainderMemberId: string,
): IComputedShare[] {
  const totalWeight = weights.reduce((acc, item) => acc + item.weight, 0);
  if (totalWeight <= 0) {
    throw new Error("Share weights must be greater than zero");
  }

  let assigned = 0;
  const shares = weights.map((item) => {
    const shareMinor = Math.floor((totalMinor * item.weight) / totalWeight);
    assigned += shareMinor;
    return { memberId: item.memberId, shareMinor };
  });

  const remainder = totalMinor - assigned;
  const remainderIndex = shares.findIndex(
    (share) => share.memberId === remainderMemberId,
  );
  const targetIndex = remainderIndex >= 0 ? remainderIndex : 0;
  shares[targetIndex]!.shareMinor += remainder;

  return shares.map((share) => ({
    memberId: share.memberId,
    shareAmount: fromMinorUnits(share.shareMinor, currency),
  }));
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

export function computePercentShares(
  totalAmount: string,
  currency: string,
  shares: ISplitShareInput[],
  payerMemberId: string,
): IComputedShare[] {
  if (shares.length === 0) {
    return [];
  }

  const weights = shares.map((share) => ({
    memberId: share.memberId,
    weight: parseNonNegative(share.shareAmount),
  }));
  const percentSum = weights.reduce((acc, item) => acc + item.weight, 0);
  if (Math.round(percentSum * 100) !== 10000) {
    throw new Error("Percentages must sum to 100");
  }

  const totalMinor = toMinorUnits(parseFloat(totalAmount), currency);
  return distributeByWeights(totalMinor, currency, weights, payerMemberId);
}

export function computeWeightedShares(
  totalAmount: string,
  currency: string,
  shares: ISplitShareInput[],
  payerMemberId: string,
): IComputedShare[] {
  if (shares.length === 0) {
    return [];
  }

  const weights = shares.map((share) => ({
    memberId: share.memberId,
    weight: parseNonNegative(share.shareAmount),
  }));
  if (weights.every((item) => item.weight <= 0)) {
    throw new Error("Share weights must be greater than zero");
  }

  const totalMinor = toMinorUnits(parseFloat(totalAmount), currency);
  return distributeByWeights(totalMinor, currency, weights, payerMemberId);
}

export function computeShares(
  splitMode: ISplitMode,
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
  if (splitMode === "percent") {
    if (!exactShares?.length) {
      throw new Error("Percent split requires percentages");
    }
    return computePercentShares(
      totalAmount,
      currency,
      exactShares,
      payerMemberId,
    );
  }
  if (splitMode === "shares") {
    if (!exactShares?.length) {
      throw new Error("Shares split requires weights");
    }
    return computeWeightedShares(
      totalAmount,
      currency,
      exactShares,
      payerMemberId,
    );
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
