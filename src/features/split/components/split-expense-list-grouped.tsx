import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { SplitExpenseListItem } from "@/features/split/components/split-expense-list-item";
import { canEditSplitExpense } from "@/features/split/utils/can-edit-split-expense";
import { groupSplitExpensesByDate } from "@/features/split/utils/group-split-expenses-by-date";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { List } from "@/features/ui/list/list";
import { cn } from "@/features/util/cn";
import { HiReceiptPercent } from "react-icons/hi2";

export function SplitExpenseListGrouped({
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

  const dateGroups = groupSplitExpensesByDate(expenses);

  return (
    <div className="overflow-hidden">
      {dateGroups.map((group, groupIndex) => (
        <div
          key={group.date}
          className={cn(groupIndex > 0 && "mt-6")}>
          <div className="px-4 py-2 mb-2">
            <h3 className="text-sm font-semibold text-text-muted">
              {group.dateHeader}
            </h3>
          </div>
          <List data={group.expenses}>
            {(expense) => (
              <SplitExpenseListItem
                key={expense.id}
                expense={expense}
                groupCurrency={groupCurrency}
                viewerMemberId={viewer?.memberId}
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
        </div>
      ))}
    </div>
  );
}
