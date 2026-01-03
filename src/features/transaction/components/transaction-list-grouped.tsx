import { Currency } from "@/features/currency/components/currency";
import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { useIntersectionObserver } from "@/features/shared/hooks/useIntersectionObserver";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { PAYMENT_METHOD_LABELS } from "@/features/transaction/config/payment-methods";
import { groupTransactionsByDate } from "@/features/transaction/utils/group-transactions-by-date";
import { Badge } from "@/features/ui/badge/badge";
import { IconButton } from "@/features/ui/button/icon-button";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Loading } from "@/features/ui/loading/loading";
import { cn } from "@/features/util/cn";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { HiPencil, HiTrash } from "react-icons/hi2";

type ITransactionListGroupedProps = {
  data: ITransaction[];
  searchQuery: string;
  onDelete?: (transaction: ITransaction) => void;
  onEdit?: (transaction: ITransaction) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
};

export function TransactionListGrouped({
  data,
  searchQuery,
  onDelete,
  onEdit,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
}: ITransactionListGroupedProps) {
  const { highlightText } = useHighlightText();
  const dateGroups = groupTransactionsByDate(data);

  // Set up intersection observer for infinite scroll
  const loadMoreRef = useIntersectionObserver(
    () => {
      if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
        fetchNextPage();
      }
    },
    {
      enabled: hasNextPage && !!fetchNextPage,
    }
  );

  if (dateGroups.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden">
      {dateGroups.map((group, groupIndex) => (
        <div
          key={group.date}
          className={cn("mb-4", groupIndex > 0 && "mt-6")}>
          {/* Date Header */}
          <div className="px-4 py-2 mb-2">
            <h3 className="text-sm font-semibold text-text-muted">
              {group.dateHeader}
            </h3>
          </div>

          {/* Transactions in this date group */}
          <List
            data={group.transactions}
            getItemKey={(transaction) => transaction.id}>
            {(transaction) => {
              const isExpense = transaction.type === "EXPENSE";
              const isIncome = transaction.type === "INCOME";

              return (
                <ListItem className={cn("group flex-col items-stretch gap-1")}>
                  {/* Top row: Name, Time, Actions, Amount */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-text font-medium truncate">
                        {highlightText(transaction.name, searchQuery)}
                      </span>
                      <span className="text-text-muted">•</span>
                      <span className="text-sm text-text-muted whitespace-nowrap">
                        {DateFormatHelpers.formatIsoStringToString(
                          transaction.transactionDate,
                          transaction.timePrecision
                        )}
                      </span>
                      <span className="text-text-muted">•</span>
                      <Badge className="text-xs">
                        {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Amount */}
                      <Currency
                        amount={`${transaction.type === "EXPENSE" ? "-" : ""}${transaction.amount}`}
                        currency={transaction.currency}
                        searchQuery={searchQuery}
                        className={cn("font-semibold text-lg")}
                      />

                      {(onEdit || onDelete) && (
                        <div className="flex items-center ml-1 gap-1 opacity-20 group-hover:opacity-100 focus-within:opacity-100 motion-safe:transition-opacity">
                          {onEdit && (
                            <IconButton
                              clicked={() => onEdit(transaction)}
                              size="sm">
                              <HiPencil className="size-4" />
                            </IconButton>
                          )}

                          {onDelete && (
                            <Dropdown size="sm">
                              <DropdownItem
                                icon={<HiTrash className="size-4" />}
                                text="Delete"
                                clicked={() => onDelete(transaction)}
                                className="text-danger hover:bg-danger/10"
                              />
                            </Dropdown>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Primary tag badge */}
                  {transaction.primaryTag && (
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge
                        backgroundColor={
                          transaction.primaryTag.color ?? undefined
                        }>
                        {highlightText(
                          transaction.primaryTag.name,
                          searchQuery
                        )}
                      </Badge>
                    </div>
                  )}

                  {/* Description row */}
                  {transaction.description && (
                    <p className="text-sm text-text-muted truncate">
                      {highlightText(transaction.description, searchQuery)}
                    </p>
                  )}
                </ListItem>
              );
            }}
          </List>
        </div>
      ))}

      {/* Infinite scroll sentinel and loading indicator */}
      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-4">
          {isFetchingNextPage && (
            <Loading
              text="Loading more transactions"
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
}
