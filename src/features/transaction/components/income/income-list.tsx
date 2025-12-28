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

type IIncomeListProps = {
  data: ITransaction[];
  searchQuery: string;
  onDelete?: (income: ITransaction) => void;
  onEdit?: (income: ITransaction) => void;
};

export function IncomeList({
  data,
  searchQuery,
  onDelete,
  onEdit,
}: IIncomeListProps) {
  const { highlightText } = useHighlightText();

  return (
    <List
      data={data}
      getItemKey={(income) => income.id}>
      {(income) => (
        <ListItem className="group flex-col items-stretch gap-1 py-4">
          {/* Top row: Name, Date, Actions, Amount */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-text font-medium truncate">
                {searchQuery
                  ? highlightText(income.name, searchQuery)
                  : income.name}
              </span>
              <span className="text-text-muted">|</span>
              <span className="text-sm text-text-muted whitespace-nowrap">
                {DateFormatHelpers.formatIsoStringToString(income.occurredAt)}
              </span>
              <span className="text-text-muted">|</span>
              <Badge className="text-xs">
                {PAYMENT_METHOD_LABELS[income.paymentMethod]}
              </Badge>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Amount */}
              <span className="text-text font-semibold text-lg">
                {searchQuery
                  ? highlightText(
                      formatCurrency(income.amount, income.currency),
                      searchQuery
                    )
                  : formatCurrency(income.amount, income.currency)}
              </span>

              {/* Action buttons - visible on hover */}
              {(onEdit || onDelete) && (
                <div className="flex items-center ml-1 gap-1 opacity-20 group-hover:opacity-100 motion-safe:transition-opacity">
                  {onEdit && (
                    <IconButton
                      clicked={() => onEdit(income)}
                      size="sm">
                      <HiPencil className="size-4" />
                    </IconButton>
                  )}

                  {onDelete && (
                    <Dropdown size="sm">
                      <DropdownItem
                        icon={<HiTrash className="size-4" />}
                        text="Delete"
                        clicked={() => onDelete(income)}
                        className="text-danger hover:bg-danger/10"
                      />
                    </Dropdown>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Primary tag badge */}
          {income.primaryTag && (
            <div className="flex gap-1.5 flex-wrap">
              <Badge backgroundColor={income.primaryTag.color ?? undefined}>
                {searchQuery
                  ? highlightText(income.primaryTag.name, searchQuery)
                  : income.primaryTag.name}
              </Badge>
            </div>
          )}

          {/* Description row */}
          {income.description && (
            <p className="text-sm text-text-muted truncate">
              {searchQuery
                ? highlightText(income.description, searchQuery)
                : income.description}
            </p>
          )}
        </ListItem>
      )}
    </List>
  );
}
