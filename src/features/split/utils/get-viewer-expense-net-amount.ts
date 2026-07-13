import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";

type IExpenseForViewerNet = Pick<
  ISplitExpense,
  "paidByMemberId" | "groupAmount" | "amount" | "currency" | "shares"
>;

function resolveGroupAmount(
  expense: IExpenseForViewerNet,
  groupCurrency: string,
): number | null {
  const groupAmountStr =
    expense.groupAmount ??
    (expense.currency === groupCurrency ? expense.amount : null);
  if (!groupAmountStr) {
    return null;
  }
  const groupAmount = parseFloat(groupAmountStr);
  return Number.isFinite(groupAmount) ? groupAmount : null;
}

function resolveViewerShareAmount(
  expense: IExpenseForViewerNet,
  viewerMemberId: string,
  groupCurrency: string,
): number {
  const viewerShare = expense.shares.find(
    (share) => share.memberId === viewerMemberId && share.status === "active",
  );
  if (!viewerShare) {
    return 0;
  }

  const shareAmountStr =
    viewerShare.shareGroupAmount ??
    (expense.currency === groupCurrency ? viewerShare.shareAmount : null);
  if (!shareAmountStr) {
    return 0;
  }

  const shareAmount = parseFloat(shareAmountStr);
  return Number.isFinite(shareAmount) ? shareAmount : 0;
}

/** Net effect of one expense on the viewer in group currency (positive = owed to viewer). */
export function getViewerExpenseNetAmount(
  expense: IExpenseForViewerNet,
  viewerMemberId: string,
  groupCurrency: string,
): number | null {
  const groupAmount = resolveGroupAmount(expense, groupCurrency);
  if (groupAmount == null || groupAmount === 0) {
    return null;
  }

  const viewerShareAmount = resolveViewerShareAmount(
    expense,
    viewerMemberId,
    groupCurrency,
  );
  const viewerPaid = expense.paidByMemberId === viewerMemberId;

  if (!viewerPaid && viewerShareAmount === 0) {
    return null;
  }

  return viewerPaid ? groupAmount - viewerShareAmount : -viewerShareAmount;
}

/** Signed amount in group currency (e.g. "+€1.00", "-€1.00"). */
export function formatViewerExpenseNetAmount(
  netAmount: number,
  groupCurrency: string,
): string {
  const prefix = netAmount < 0 ? "-" : "+";
  return `${prefix}${formatCurrency(Math.abs(netAmount).toFixed(2), groupCurrency)}`;
}
