import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { SplitExpenseListItem } from "@/features/split/components/split-expense-list-item";
import { canEditSplitExpense } from "@/features/split/utils/can-edit-split-expense";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { List } from "@/features/ui/list/list";
import { HiReceiptPercent } from "react-icons/hi2";

export function SplitExpenseList({
  expenses,
  groupCurrency,
  viewer,
  onEdit,
  onDelete,
}: {
  expenses: ISplitExpense[];
  groupCurrency: string;
  viewer?: { userId: string; memberId: string; role: string };
  onEdit?: (expense: ISplitExpense) => void;
  onDelete?: (expense: ISplitExpense) => void;
}) {
  if (expenses.length === 0) {
    return (
      <EmptyPage
        icon={HiReceiptPercent}
        emptyText="No expenses yet. Add one to get started."
      />
    );
  }

  return (
    <List data={expenses}>
      {(expense) => (
        <SplitExpenseListItem
          key={expense.id}
          expense={expense}
          groupCurrency={groupCurrency}
          canEdit={
            Boolean(onEdit) &&
            viewer != null &&
            canEditSplitExpense(expense, viewer)
          }
          onEdit={onEdit ?? (() => {})}
          onDelete={onDelete ?? (() => {})}
        />
      )}
    </List>
  );
}
