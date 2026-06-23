import { Currency } from "@/features/currency/components/currency";
import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { useIntersectionObserver } from "@/features/shared/hooks/useIntersectionObserver";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { PAYMENT_METHOD_LABELS } from "@/features/transaction/config/payment-methods";
import { TransactionRowActions } from "@/features/transaction/components/transaction-row-actions";
import { groupTransactionsByDate } from "@/features/transaction/utils/group-transactions-by-date";
import { Badge } from "@/features/ui/badge/badge";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Loading } from "@/features/ui/loading/loading";
import { cn } from "@/features/util/cn";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { HiArrowPath } from "react-icons/hi2";

type ITransactionListGroupedProps = {
  data: ITransaction[];
  searchQuery: string;
  showDescription?: boolean;
  onDelete?: (transaction: ITransaction) => void;
  onEdit?: (transaction: ITransaction) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
};

export function TransactionListGrouped({
  data,
  searchQuery,
  showDescription = true,
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
            {(transaction) => (
                <ListItem
                  className="flex-col items-stretch gap-1"
                  clicked={
                    onEdit ? () => onEdit(transaction) : undefined
                  }>
                  {/* Top row: Name, Time, Actions, Amount */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-text font-medium truncate">
                        {highlightText(transaction.name, searchQuery)}
                      </span>
                      {transaction.timePrecision === "DateTime" && (
                        <>
                          <span className="text-text-muted">•</span>
                          <span className="text-sm text-text-muted whitespace-nowrap">
                            {DateFormatHelpers.formatIsoStringToTimeOnly(
                              transaction.transactionDate,
                            )}
                          </span>
                        </>
                      )}
                      <span className="text-text-muted">•</span>
                      <Badge className="text-xs">
                        {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Amount */}
                      <Currency
                        amount={transaction.amount}
                        type={transaction.type}
                        currency={transaction.currency}
                        searchQuery={searchQuery}
                        className={cn("font-semibold text-lg")}
                      />

                      {(onEdit || onDelete) && (
                        <TransactionRowActions
                          transaction={transaction}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      )}
                    </div>
                  </div>

                  {/* Primary tag + subscription badges */}
                  {(transaction.primaryTag || transaction.subscription) && (
                    <div className="flex gap-1.5 flex-wrap">
                      {transaction.primaryTag && (
                        <Badge
                          backgroundColor={
                            transaction.primaryTag.color ?? undefined
                          }>
                          {highlightText(
                            transaction.primaryTag.name,
                            searchQuery
                          )}
                        </Badge>
                      )}
                      {transaction.subscription && (
                        <Badge
                          variant="info"
                          tooltip={`Part of "${transaction.subscription.name}" subscription`}>
                          <HiArrowPath className="size-3" />
                          Recurring
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Description row */}
                  {showDescription && transaction.description && (
                    <p className="text-sm text-text-muted truncate">
                      {highlightText(transaction.description, searchQuery)}
                    </p>
                  )}
                </ListItem>
            )}
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
