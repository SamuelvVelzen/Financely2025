import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import {
  parseSplitMode,
  type ISplitMode,
} from "@/features/split/utils/split-mode";
import { computeEqualShares } from "@/features/split/utils/split-share-calculator";
import { getCurrencyMinorUnits } from "@/features/currency/config/currencies";

export type ISplitExpenseFormValues = {
  description: string;
  amount: string;
  currency: string;
  expenseDate: string;
  paidByMemberId: string;
  participantMemberIds: string[];
  splitMode: ISplitMode;
  /** Per-member input for exact amounts, percentages, or share weights. */
  shareInputs: Record<string, string>;
};

function toMinorUnits(amount: number, currency: string): number {
  const factor = 10 ** getCurrencyMinorUnits(currency);
  return Math.round(amount * factor);
}

export function buildEqualAmountInputs(
  amount: string,
  currency: string,
  participantMemberIds: string[],
  paidByMemberId: string,
): Record<string, string> {
  if (!amount.trim() || participantMemberIds.length === 0) {
    return Object.fromEntries(participantMemberIds.map((id) => [id, ""]));
  }

  return Object.fromEntries(
    computeEqualShares(amount, currency, participantMemberIds, paidByMemberId).map(
      (share) => [share.memberId, share.shareAmount],
    ),
  );
}

export function buildEqualPercentInputs(
  participantMemberIds: string[],
): Record<string, string> {
  if (participantMemberIds.length === 0) {
    return {};
  }

  const base = Math.floor(10000 / participantMemberIds.length);
  const remainder = 10000 - base * participantMemberIds.length;

  return Object.fromEntries(
    participantMemberIds.map((id, index) => {
      const value = (base + (index === 0 ? remainder : 0)) / 100;
      return [id, value.toFixed(2)];
    }),
  );
}

export function buildEqualShareWeightInputs(
  participantMemberIds: string[],
): Record<string, string> {
  return Object.fromEntries(participantMemberIds.map((id) => [id, "1"]));
}

function buildPercentInputsFromAmounts(
  amount: string,
  currency: string,
  shares: Array<{ memberId: string; shareAmount: string }>,
): Record<string, string> {
  const totalMinor = toMinorUnits(parseFloat(amount), currency);
  if (totalMinor <= 0) {
    return buildEqualPercentInputs(shares.map((share) => share.memberId));
  }

  let assigned = 0;
  const entries = shares.map((share, index) => {
    const shareMinor = toMinorUnits(parseFloat(share.shareAmount), currency);
    const percentMinor =
      index === shares.length - 1
        ? 10000 - assigned
        : Math.round((shareMinor * 10000) / totalMinor);
    assigned += index === shares.length - 1 ? 0 : percentMinor;
    return [share.memberId, (percentMinor / 100).toFixed(2)] as const;
  });

  return Object.fromEntries(entries);
}

function buildShareWeightInputsFromAmounts(
  currency: string,
  shares: Array<{ memberId: string; shareAmount: string }>,
): Record<string, string> {
  const minors = shares.map((share) =>
    toMinorUnits(parseFloat(share.shareAmount), currency),
  );
  const gcd = minors.reduce((acc, value) => {
    let a = Math.abs(acc);
    let b = Math.abs(value);
    while (b !== 0) {
      const next = a % b;
      a = b;
      b = next;
    }
    return a || 1;
  }, minors[0] ?? 1);

  return Object.fromEntries(
    shares.map((share, index) => [
      share.memberId,
      String(Math.max(1, Math.round(minors[index]! / gcd))),
    ]),
  );
}

export function getEmptySplitExpenseFormValues(
  groupCurrency: string,
  currentMemberId: string,
  memberIds: string[],
): ISplitExpenseFormValues {
  return {
    description: "",
    amount: "",
    currency: groupCurrency,
    expenseDate: new Date().toISOString(),
    paidByMemberId: currentMemberId,
    participantMemberIds: memberIds,
    splitMode: "equal",
    shareInputs: {},
  };
}

export function getSplitExpenseFormValuesFromExpense(
  expense: ISplitExpense,
): ISplitExpenseFormValues {
  const activeShares = expense.shares.filter((share) => share.status === "active");
  const participantMemberIds = activeShares.map((share) => share.memberId);
  const splitMode = parseSplitMode(expense.splitMode);

  let shareInputs: Record<string, string> = {};
  if (splitMode === "exact") {
    shareInputs = Object.fromEntries(
      activeShares.map((share) => [share.memberId, share.shareAmount]),
    );
  } else if (splitMode === "percent") {
    shareInputs = buildPercentInputsFromAmounts(
      expense.amount,
      expense.currency,
      activeShares,
    );
  } else if (splitMode === "shares") {
    shareInputs = buildShareWeightInputsFromAmounts(
      expense.currency,
      activeShares,
    );
  }

  return {
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency,
    expenseDate: expense.expenseDate,
    paidByMemberId: expense.paidByMemberId,
    participantMemberIds,
    splitMode,
    shareInputs,
  };
}

/** Keeps split settings when adding another expense (like transactions). */
export function getFormValuesForAnotherExpense(
  submitted: ISplitExpenseFormValues,
  groupCurrency: string,
  memberIds: string[],
): ISplitExpenseFormValues {
  return {
    ...getEmptySplitExpenseFormValues(
      groupCurrency,
      submitted.paidByMemberId,
      memberIds,
    ),
    currency: submitted.currency,
    expenseDate: submitted.expenseDate,
    paidByMemberId: submitted.paidByMemberId,
    participantMemberIds: submitted.participantMemberIds,
    splitMode: submitted.splitMode,
    shareInputs:
      submitted.splitMode === "equal"
        ? {}
        : submitted.splitMode === "shares"
          ? buildEqualShareWeightInputs(submitted.participantMemberIds)
          : submitted.splitMode === "percent"
            ? buildEqualPercentInputs(submitted.participantMemberIds)
            : {},
  };
}

export function getExactSharesForSubmit(
  values: ISplitExpenseFormValues,
): Array<{ memberId: string; shareAmount: string }> | undefined {
  if (values.splitMode === "equal") {
    return undefined;
  }

  return values.participantMemberIds.map((memberId) => ({
    memberId,
    shareAmount: values.shareInputs[memberId]?.trim() || "0",
  }));
}
