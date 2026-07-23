import type { ICreateSplitExpenseInput } from "@/features/shared/validation/schemas";
import { parseSplitMode } from "../utils/split-mode";
import { computeShares } from "../utils/split-share-calculator";

export type ISplitExpense = {
  id: string;
  description: string;
  amount: string;
  currency: string;
  groupAmount: string | null;
  conversionStatus: string;
  expenseDate: string;
  splitMode: string;
  paidByMemberId: string;
  paidByDisplayName: string;
  createdByUserId: string | null;
  clientMutationId: string | null;
  syncState?: "pending";
  shares: Array<{
    id: string;
    memberId: string;
    displayName: string;
    shareAmount: string;
    shareGroupAmount: string | null;
    status: string;
  }>;
  createdAt: string;
};

export function buildOptimisticSplitExpense(
  input: ICreateSplitExpenseInput,
  clientMutationId: string,
): ISplitExpense {
  const shares = computeShares(
    parseSplitMode(input.splitMode),
    input.amount,
    input.currency,
    input.participantMemberIds,
    input.paidByMemberId,
    input.exactShares,
  );

  return {
    id: `optimistic-${clientMutationId}`,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    groupAmount: input.currency === input.currency ? input.amount : null,
    conversionStatus: "pending",
    expenseDate: input.expenseDate,
    splitMode: input.splitMode,
    paidByMemberId: input.paidByMemberId,
    paidByDisplayName: "You",
    createdByUserId: null,
    clientMutationId,
    syncState: "pending",
    shares: shares.map((s, i) => ({
      id: `optimistic-share-${i}`,
      memberId: s.memberId,
      displayName: "",
      shareAmount: s.shareAmount,
      shareGroupAmount: null,
      status: "active",
    })),
    createdAt: new Date().toISOString(),
  };
}
