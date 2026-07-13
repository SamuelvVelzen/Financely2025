import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";

export function canEditSplitExpense(
  expense: Pick<ISplitExpense, "createdByUserId" | "paidByMemberId">,
  viewer: { userId: string; memberId: string; role: string },
): boolean {
  if (viewer.role === "admin") {
    return true;
  }
  if (expense.createdByUserId === viewer.userId) {
    return true;
  }
  if (expense.paidByMemberId === viewer.memberId) {
    return true;
  }
  return false;
}
