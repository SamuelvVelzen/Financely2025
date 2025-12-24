import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { IconButton } from "@/features/ui/button/icon-button";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { Table } from "@/features/ui/table/table";
import { TableRow } from "@/features/ui/table/table-row";
import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { useMemo } from "react";
import { HiPencil, HiTrash } from "react-icons/hi2";

type IExpenseListProps = {
  data: ITransaction[];
  searchQuery: string;
  onDelete?: (expense: ITransaction) => void;
  onEdit?: (expense: ITransaction) => void;
};

export function ExpenseTable({
  data,
  searchQuery,
  onDelete,
  onEdit,
}: IExpenseListProps) {
  const { highlightText } = useHighlightText();

  // Format date
  // Memoize sort functions to prevent infinite re-renders
  const sortFns = useMemo(
    () => ({
      amount: (a: ITransaction, b: ITransaction) => {
        return parseFloat(a.amount) - parseFloat(b.amount);
      },
      occurredAt: (a: ITransaction, b: ITransaction) => {
        return (
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
        );
      },
      tags: (a: ITransaction, b: ITransaction) => {
        const aTag = a.primaryTag?.name ?? "";
        const bTag = b.primaryTag?.name ?? "";
        return aTag.localeCompare(bTag);
      },
    }),
    []
  );

  const headerCells = useMemo(
    () => [
      <HeaderCell
        key="name"
        sortKey="name"
        autoFit={false}>
        Name
      </HeaderCell>,
      <HeaderCell
        key="amount"
        sortKey="amount"
        sortFn={sortFns.amount}>
        Amount
      </HeaderCell>,
      <HeaderCell
        key="occurredAt"
        sortKey="occurredAt"
        sortFn={sortFns.occurredAt}>
        Date
      </HeaderCell>,
      <HeaderCell
        key="description"
        sortKey="description">
        Description
      </HeaderCell>,
      <HeaderCell
        key="tags"
        sortKey="tags"
        sortFn={sortFns.tags}>
        Tags
      </HeaderCell>,
      <HeaderCell
        key="actions"
        sortable={false}
        align="right">
        Actions
      </HeaderCell>,
    ],
    [sortFns]
  );

  return (
    <Table
      data={data}
      defaultSort={{ sortKey: "occurredAt", direction: "desc" }}
      headerCells={headerCells}>
      {(sortedData) => {
        // Calculate sums by currency
        const sumsByCurrency = sortedData.reduce(
          (acc, expense) => {
            const currency = expense.currency;
            const amount = parseFloat(expense.amount);
            if (!acc[currency]) {
              acc[currency] = 0;
            }
            acc[currency] += amount;
            return acc;
          },
          {} as Record<string, number>
        );

        return (
          <>
            {sortedData.map((expense) => (
              <TableRow
                key={expense.id}
                className="group">
                <BodyCell>
                  <span className="text-text font-medium">
                    {searchQuery
                      ? highlightText(expense.name, searchQuery)
                      : expense.name}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-text font-semibold">
                    {searchQuery
                      ? highlightText(
                          formatCurrency(expense.amount, expense.currency),
                          searchQuery
                        )
                      : formatCurrency(expense.amount, expense.currency)}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-sm text-text-muted">
                    {DateFormatHelpers.formatIsoStringToString(
                      expense.occurredAt
                    )}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-sm text-text-muted">
                    {searchQuery
                      ? highlightText(expense.description ?? "", searchQuery)
                      : expense.description}
                  </span>
                </BodyCell>
                <BodyCell>
                  {expense.primaryTag ? (
                    <span className="px-2 py-0.5 bg-surface-hover rounded text-xs">
                      {searchQuery
                        ? highlightText(expense.primaryTag.name, searchQuery)
                        : expense.primaryTag.name}
                    </span>
                  ) : (
                    <span className="text-sm text-text-muted">—</span>
                  )}
                </BodyCell>
                <BodyCell>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
                    {onEdit && (
                      <IconButton
                        clicked={() => onEdit?.(expense)}
                        className="text-text-muted hover:text-text p-1">
                        <HiPencil className="w-5 h-5" />
                      </IconButton>
                    )}

                    {onDelete && (
                      <IconButton
                        clicked={() => onDelete?.(expense)}
                        className="text-danger hover:text-danger-hover p-1">
                        <HiTrash className="w-5 h-5" />
                      </IconButton>
                    )}
                  </div>
                </BodyCell>
              </TableRow>
            ))}
            {Object.keys(sumsByCurrency).length > 0 && (
              <TableRow className="bg-surface-hover font-semibold">
                <BodyCell>
                  <span className="text-text">Total</span>
                </BodyCell>
                <BodyCell>
                  <span className="text-text">
                    {Object.entries(sumsByCurrency)
                      .map(([currency, sum]) =>
                        formatCurrency(
                          sum.toFixed(2),
                          currency as ITransaction["currency"]
                        )
                      )
                      .join(" / ")}
                  </span>
                </BodyCell>
                <BodyCell colSpan={4}></BodyCell>
              </TableRow>
            )}
          </>
        );
      }}
    </Table>
  );
}
