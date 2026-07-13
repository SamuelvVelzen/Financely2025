import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { SplitExpenseListGrouped } from "@/features/split/components/split-expense-list-grouped";

/** @deprecated Use SplitExpenseListGrouped */
export function SplitExpenseList(props: {
  expenses: ISplitExpense[];
  groupCurrency: string;
  viewer?: { userId: string; memberId: string; role: string };
  onEdit?: (expense: ISplitExpense) => void;
  onDelete?: (expense: ISplitExpense) => void;
}) {
  return <SplitExpenseListGrouped {...props} />;
}
