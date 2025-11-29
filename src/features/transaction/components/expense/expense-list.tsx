import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { IconButton } from "@/features/ui/button/icon-button";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { formatCurrency } from "@/util/currency/currencyhelpers";
import { HiPencil, HiTrash } from "react-icons/hi2";

type IExpenseListProps = {
  data: ITransaction[];
  searchQuery: string;
  onDelete?: (expense: ITransaction) => void;
  onEdit?: (expense: ITransaction) => void;
};

export function ExpenseList({
  data,
  searchQuery,
  onDelete,
  onEdit,
}: IExpenseListProps) {
  const { highlightText } = useHighlightText();

  // Format date
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <List data={data}>
      {(expense) => (
        <ListItem className="group">
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-text font-medium">
                {searchQuery
                  ? highlightText(expense.name, searchQuery)
                  : expense.name}
              </span>
              <span className="text-text font-semibold">
                {searchQuery
                  ? highlightText(
                      formatCurrency(expense.amount, expense.currency),
                      searchQuery
                    )
                  : formatCurrency(expense.amount, expense.currency)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-text-muted">
              <span>{formatDate(expense.occurredAt)}</span>
              {expense.description && (
                <span className="text-text-muted">
                  {searchQuery
                    ? highlightText(expense.description, searchQuery)
                    : expense.description}
                </span>
              )}
              {expense.tags.length > 0 && (
                <div className="flex gap-1">
                  {expense.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 bg-surface-hover rounded text-xs"
                    >
                      {searchQuery
                        ? highlightText(tag.name, searchQuery)
                        : tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
            {onEdit && (
              <IconButton
                clicked={() => onEdit?.(expense)}
                className="text-text-muted hover:text-text p-1"
              >
                <HiPencil className="w-5 h-5" />
              </IconButton>
            )}

            {onDelete && (
              <IconButton
                clicked={() => onDelete?.(expense)}
                className="text-danger hover:text-danger-hover p-1"
              >
                <HiTrash className="w-5 h-5" />
              </IconButton>
            )}
          </div>
        </ListItem>
      )}
    </List>
  );
}
