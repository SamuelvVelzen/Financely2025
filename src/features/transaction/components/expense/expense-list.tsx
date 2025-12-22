import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { PAYMENT_METHOD_LABELS } from "@/features/transaction/config/payment-methods";
import { Badge } from "@/features/ui/badge/badge";
import { IconButton } from "@/features/ui/button/icon-button";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
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

  return (
    <List
      data={data}
      getItemKey={(expense) => expense.id}>
      {(expense) => (
        <ListItem className="group flex-col items-stretch gap-1 py-4">
          {/* Top row: Name, Date, Actions, Amount */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-text font-medium truncate">
                {searchQuery
                  ? highlightText(expense.name, searchQuery)
                  : expense.name}
              </span>
              <span className="text-text-muted">|</span>
              <span className="text-sm text-text-muted whitespace-nowrap">
                {DateFormatHelpers.formatIsoStringToString(expense.occurredAt)}
              </span>
              <span className="text-text-muted">|</span>
              <Badge variant="outline" className="text-xs">
                {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
              </Badge>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Action buttons - visible on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
                {onEdit && (
                  <IconButton
                    clicked={() => onEdit(expense)}
                    size="sm">
                    <HiPencil className="size-4" />
                  </IconButton>
                )}

                {onDelete && (
                  <IconButton
                    clicked={() => onDelete(expense)}
                    variant="danger"
                    size="sm">
                    <HiTrash className="size-4" />
                  </IconButton>
                )}
              </div>

              {/* Amount */}
              <span className="text-text font-semibold text-lg">
                {searchQuery
                  ? highlightText(
                      formatCurrency(expense.amount, expense.currency),
                      searchQuery
                    )
                  : formatCurrency(expense.amount, expense.currency)}
              </span>
            </div>
          </div>

          {/* Tag badges row */}
          {expense.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {expense.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  backgroundColor={tag.color ?? undefined}>
                  {searchQuery
                    ? highlightText(tag.name, searchQuery)
                    : tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Description row */}
          {expense.description && (
            <p className="text-sm text-text-muted truncate">
              {searchQuery
                ? highlightText(expense.description, searchQuery)
                : expense.description}
            </p>
          )}
        </ListItem>
      )}
    </List>
  );
}
