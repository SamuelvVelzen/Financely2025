import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { PAYMENT_METHOD_LABELS } from "@/features/transaction/config/payment-methods";
import { Badge } from "@/features/ui/badge/badge";
import { IconButton } from "@/features/ui/button/icon-button";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
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
              <Badge className="text-xs">
                {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
              </Badge>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Amount */}
              <span className="text-text font-semibold text-lg">
                {searchQuery
                  ? highlightText(
                      formatCurrency(expense.amount, expense.currency),
                      searchQuery
                    )
                  : formatCurrency(expense.amount, expense.currency)}
              </span>

              {(onEdit || onDelete) && (
                <div className="flex items-center ml-1 gap-1 opacity-20 group-hover:opacity-100 motion-safe:transition-opacity">
                  {onEdit && (
                    <IconButton
                      clicked={() => onEdit(expense)}
                      size="sm">
                      <HiPencil className="size-4" />
                    </IconButton>
                  )}

                  {onDelete && (
                    <Dropdown size="sm">
                      <DropdownItem
                        icon={<HiTrash className="size-4" />}
                        text="Delete"
                        clicked={() => onDelete(expense)}
                        className="text-danger hover:bg-danger/10"
                      />
                    </Dropdown>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Primary tag badge */}
          {expense.primaryTag && (
            <div className="flex gap-1.5 flex-wrap">
              <Badge backgroundColor={expense.primaryTag.color ?? undefined}>
                {searchQuery
                  ? highlightText(expense.primaryTag.name, searchQuery)
                  : expense.primaryTag.name}
              </Badge>
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
