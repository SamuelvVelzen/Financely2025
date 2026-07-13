import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { ListItem } from "@/features/ui/list/list-item";
import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { HiPencil, HiTrash } from "react-icons/hi2";

export function SplitExpenseListItem({
  expense,
  groupCurrency,
  canEdit,
  onEdit,
  onDelete,
}: {
  expense: ISplitExpense;
  groupCurrency: string;
  canEdit: boolean;
  onEdit: (expense: ISplitExpense) => void;
  onDelete: (expense: ISplitExpense) => void;
}) {
  return (
    <ListItem
      className="py-3"
      clicked={canEdit ? () => onEdit(expense) : undefined}>
      <div className="flex w-full min-w-0 justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-text truncate">{expense.description}</p>
          <p className="text-sm text-text-muted">
            Paid by {expense.paidByDisplayName} ·{" "}
            {new Date(expense.expenseDate).toLocaleDateString()}
          </p>
          {expense.syncState === "pending" ? (
            <span className="text-xs text-warning">Syncing when online</span>
          ) : null}
          {expense.conversionStatus === "pending" ? (
            <span className="text-xs text-warning ml-2">
              Pending conversion
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="font-medium">
              {formatCurrency(expense.amount, expense.currency)}
            </p>
            {expense.groupAmount && expense.currency !== groupCurrency ? (
              <p className="text-xs text-text-muted">
                {formatCurrency(expense.groupAmount, groupCurrency)}
              </p>
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
