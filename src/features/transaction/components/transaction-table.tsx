import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { useIntersectionObserver } from "@/features/shared/hooks/useIntersectionObserver";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { TagBadge } from "@/features/tag/components/tag-badge";
import { TransactionAmount } from "@/features/transaction/components/transaction-amount";
import { TransactionRefundBadge } from "@/features/transaction/components/transaction-refund-badge";
import { TransactionRowActions } from "@/features/transaction/components/transaction-row-actions";
import { PAYMENT_METHOD_LABELS } from "@/features/transaction/config/payment-methods";
import { getTransactionTypeLabel } from "@/features/transaction/utils/transaction-type-label";
import { Badge } from "@/features/ui/badge/badge";
import { Loading } from "@/features/ui/loading/loading";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { SelectableTable } from "@/features/ui/table/selectable-table";
import { Table } from "@/features/ui/table/table";
import { TableRow } from "@/features/ui/table/table-row";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { useMemo } from "react";
import { HiArrowPath, HiArrowsRightLeft } from "react-icons/hi2";

type ITransactionTableProps = {
  data: ITransaction[];
  searchQuery: string;
  onDelete?: (transaction: ITransaction) => void;
  onEdit?: (transaction: ITransaction) => void;
  onAllocateRefund?: (transaction: ITransaction) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
};

function compareTransactionDate(a: ITransaction, b: ITransaction): number {
  return (
    new Date(b.transactionDate).getTime() -
    new Date(a.transactionDate).getTime()
  );
}

export function TransactionTable({
  data,
  searchQuery,
  onDelete,
  onEdit,
  onAllocateRefund,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  selectedKeys,
  onSelectionChange,
}: ITransactionTableProps) {
  const bulkSelectEnabled =
    Boolean(selectedKeys) && Boolean(onSelectionChange);
  const { highlightText } = useHighlightText();
  const { isMobile } = useResponsive();
  const cellSize = isMobile ? "sm" : "md";

  const loadMoreRef = useIntersectionObserver(
    () => {
      if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
        fetchNextPage();
      }
    },
    {
      enabled: hasNextPage && !!fetchNextPage,
    },
  );

  const defaultSort = useMemo(
    () => ({
      sortKey: "transactionDate",
      direction: "desc" as const,
      sortFn: compareTransactionDate,
    }),
    [],
  );

  if (data.length === 0) {
    return null;
  }

  const headerCells = [
    <HeaderCell
      key="date"
      sortKey="transactionDate"
      sortFn={compareTransactionDate}
      size={cellSize}
    >
      Date
    </HeaderCell>,
    <HeaderCell
      key="name"
      autoFit={false}
      className="min-w-[180px]"
      sortable={false}
      size={cellSize}
      sticky={isMobile}
      stickyVertical={false}
    >
      Name
    </HeaderCell>,
    <HeaderCell key="amount" sortable={false} size={cellSize}>
      Amount
    </HeaderCell>,
    <HeaderCell
      key="currency"
      sortable={false}
      hidden={isMobile}
      size={cellSize}
    >
      Currency
    </HeaderCell>,
    <HeaderCell key="type" sortable={false} hidden={isMobile} size={cellSize}>
      Type
    </HeaderCell>,
    <HeaderCell
      key="primaryTag"
      sortable={false}
      hidden={isMobile}
      size={cellSize}
    >
      Primary Tag
    </HeaderCell>,
    <HeaderCell
      key="paymentMethod"
      sortable={false}
      hidden={isMobile}
      size={cellSize}
    >
      Payment
    </HeaderCell>,
    <HeaderCell key="actions" sortable={false} align="center" size={cellSize}>
      Actions
    </HeaderCell>,
  ];

  const renderRows = (sortedTransactions: ITransaction[]) =>
    sortedTransactions.map((transaction) => (
      <TableRow
        key={transaction.id}
        onClick={onEdit ? () => onEdit(transaction) : undefined}
        className="cursor-pointer"
      >
        <BodyCell size={cellSize}>
          {DateFormatHelpers.formatIsoStringToString(
            transaction.transactionDate,
            transaction.timePrecision,
          )}
        </BodyCell>
        <BodyCell
          size={cellSize}
          sticky={isMobile}
          autoFit={false}
          className="min-w-[180px] max-w-[240px]"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate">
              {highlightText(transaction.name, searchQuery)}
            </span>
            {transaction.subscription && (
              <Badge
                variant="info"
                tooltip={`Part of "${transaction.subscription.name}" subscription`}
              >
                <HiArrowPath className="size-3" />
              </Badge>
            )}
            <TransactionRefundBadge transaction={transaction} />
          </div>
        </BodyCell>
        <BodyCell size={cellSize}>
          <TransactionAmount
            transaction={transaction}
            searchQuery={searchQuery}
          />
        </BodyCell>
        <BodyCell size={cellSize} hidden={isMobile}>
          {transaction.currency}
        </BodyCell>
        <BodyCell size={cellSize} hidden={isMobile}>
          <Badge
            variant={
              transaction.type === "EXPENSE"
                ? "danger"
                : transaction.type === "INCOME"
                  ? "success"
                  : "default"
            }
          >
            {transaction.type === "TRANSFER" ? (
              <span className="inline-flex items-center gap-1">
                <HiArrowsRightLeft className="size-3.5" />
                {getTransactionTypeLabel(transaction)}
              </span>
            ) : (
              getTransactionTypeLabel(transaction)
            )}
          </Badge>
        </BodyCell>
        <BodyCell size={cellSize} hidden={isMobile}>
          {transaction.primaryTag ? (
            <TagBadge tag={transaction.primaryTag} searchQuery={searchQuery} />
          ) : (
            <span className="text-text-muted">—</span>
          )}
        </BodyCell>
        <BodyCell size={cellSize} hidden={isMobile}>
          <Badge className="text-xs">
            {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
          </Badge>
        </BodyCell>
        <BodyCell size={cellSize}>
          <TransactionRowActions
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
            onAllocateRefund={onAllocateRefund}
          />
        </BodyCell>
      </TableRow>
    ));

  return (
    <div>
      {bulkSelectEnabled ? (
        <SelectableTable<ITransaction, string>
          data={data}
          defaultSort={defaultSort}
          enablePagination={false}
          showSelectAllAlert={false}
          selectOnRowClick={false}
          selectedKeys={selectedKeys!}
          onSelectionChange={onSelectionChange!}
          getRowKey={(transaction: ITransaction) => transaction.id}
          rowCount={data.length}
          headerCells={headerCells}
        >
          {renderRows}
        </SelectableTable>
      ) : (
        <Table data={data} defaultSort={defaultSort} headerCells={headerCells}>
          {renderRows}
        </Table>
      )}

      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-4"
        >
          {isFetchingNextPage && (
            <Loading text="Loading more transactions" size="sm" />
          )}
        </div>
      )}
    </div>
  );
}
