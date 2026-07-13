import { Currency } from "@/features/currency/components/currency";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { getViewerExpenseNetAmount } from "@/features/split/utils/get-viewer-expense-net-amount";
import { Badge } from "@/features/ui/badge/badge";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { ListItem } from "@/features/ui/list/list-item";
import { cn } from "@/features/util/cn";
import { HiPencil, HiTrash } from "react-icons/hi2";

export function SplitExpenseListItem({
  expense,
  groupCurrency,
  viewerMemberId,
  canEdit,
  onEdit,
  onDelete,
}: {
  expense: ISplitExpense;
  groupCurrency: string;
  viewerMemberId?: string;
  canEdit: boolean;
  onEdit: (expense: ISplitExpense) => void;
  onDelete: (expense: ISplitExpense) => void;
}) {
  const viewerNet =
    viewerMemberId != null
      ? getViewerExpenseNetAmount(expense, viewerMemberId, groupCurrency)
      : null;
  const showViewerNet = viewerNet != null && Math.abs(viewerNet) > 0.005;
  const viewerOwes = showViewerNet && viewerNet < 0;

  return (
    <ListItem
      className="py-3"
      clicked={canEdit ? () => onEdit(expense) : undefined}>
      <div className="flex w-full min-w-0 justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-text truncate">{expense.description}</p>
          <p className="text-sm text-text-muted">
            Paid by {expense.paidByDisplayName}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {expense.syncState === "pending" ? (
              <Badge variant="warning">Syncing when online</Badge>
            ) : null}
            {expense.conversionStatus === "pending" ? (
              <Badge variant="warning">Pending conversion</Badge>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-col items-end text-right">
            <Currency
              amount={expense.amount}
              currency={expense.currency}
              className="font-medium"
            />
            {expense.groupAmount && expense.currency !== groupCurrency ? (
              <Currency
                amount={expense.groupAmount}
                currency={groupCurrency}
                className="text-xs text-text-muted"
              />
            ) : null}
            {showViewerNet ? (
              <Currency
                amount={Math.abs(viewerNet).toFixed(2)}
                currency={groupCurrency}
                type={viewerOwes ? "EXPENSE" : "INCOME"}
                className={cn(
                  "text-xs font-medium",
                  viewerOwes ? "text-danger" : "text-success",
                )}
              />
            ) : null}
          </div>
          {canEdit ? (
            <div
              role="presentation"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}>
              <Dropdown size="sm">
                <DropdownItem
                  icon={<HiPencil className="size-4" />}
                  text="Edit"
                  clicked={() => onEdit(expense)}
                />
                <DropdownItem
                  icon={<HiTrash className="size-4" />}
                  text="Delete"
                  clicked={() => onDelete(expense)}
                  className="text-danger hover:bg-danger/10"
                />
              </Dropdown>
            </div>
          ) : null}
        </div>
      </div>
    </ListItem>
  );
}
