import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";

export type ISplitExpenseFormValues = {
  description: string;
  amount: string;
  currency: string;
  expenseDate: string;
  paidByMemberId: string;
  participantMemberIds: string[];
};

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
  };
}

export function getSplitExpenseFormValuesFromExpense(
  expense: ISplitExpense,
): ISplitExpenseFormValues {
  return {
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency,
    expenseDate: expense.expenseDate,
    paidByMemberId: expense.paidByMemberId,
    participantMemberIds: expense.shares
      .filter((share) => share.status === "active")
      .map((share) => share.memberId),
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
  };
}
