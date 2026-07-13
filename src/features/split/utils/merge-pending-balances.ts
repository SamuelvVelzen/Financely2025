import type { IMemberBalance } from "./simplify-debts";

export type IPendingExpenseDraft = {
  paidByMemberId: string;
  groupAmount: string | null;
  shares: Array<{
    memberId: string;
    shareGroupAmount: string | null;
    status: "active" | "removed";
  }>;
};

export function mergePendingExpensesIntoBalances(
  serverBalances: IMemberBalance[],
  pendingExpenses: IPendingExpenseDraft[],
): { balances: IMemberBalance[]; hasPending: boolean } {
  if (pendingExpenses.length === 0) {
    return { balances: serverBalances, hasPending: false };
  }

  const netByMember = new Map<string, number>();
  const names = new Map<string, string>();
  for (const b of serverBalances) {
    netByMember.set(b.memberId, parseFloat(b.netAmount));
    names.set(b.memberId, b.displayName);
  }

  for (const expense of pendingExpenses) {
    const groupAmount = expense.groupAmount
      ? parseFloat(expense.groupAmount)
      : null;
    if (groupAmount == null) continue;

    const payerShare = expense.shares.find(
      (s) => s.memberId === expense.paidByMemberId && s.status === "active",
    );
    const payerGroupShare = payerShare?.shareGroupAmount
      ? parseFloat(payerShare.shareGroupAmount)
      : 0;

    const payerNet = (netByMember.get(expense.paidByMemberId) ?? 0) + (groupAmount - payerGroupShare);
    netByMember.set(expense.paidByMemberId, payerNet);

    for (const share of expense.shares) {
      if (share.status !== "active" || !share.shareGroupAmount) continue;
      const current = netByMember.get(share.memberId) ?? 0;
      netByMember.set(
        share.memberId,
        current - parseFloat(share.shareGroupAmount),
      );
    }
  }

  const balances: IMemberBalance[] = [...netByMember.entries()].map(
    ([memberId, net]) => ({
      memberId,
      displayName: names.get(memberId) ?? "Unknown",
      netAmount: net.toFixed(2),
    }),
  );

  return { balances, hasPending: true };
}
