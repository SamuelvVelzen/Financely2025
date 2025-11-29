import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { IconButton } from "@/features/ui/button/icon-button";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { Table } from "@/features/ui/table/table";
import { TableRow } from "@/features/ui/table/table-row";
import { formatCurrency } from "@/util/currency/currencyhelpers";
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
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const headerCells = [
    <HeaderCell sortKey="name" autoFit={false}>
      Name
    </HeaderCell>,
    <HeaderCell
      sortKey="amount"
      sortFn={(a: ITransaction, b: ITransaction) => {
        return parseFloat(a.amount) - parseFloat(b.amount);
      }}
    >
      Amount
    </HeaderCell>,
    <HeaderCell
      sortKey="occurredAt"
      sortFn={(a: ITransaction, b: ITransaction) => {
        return (
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
        );
      }}
    >
      Date
    </HeaderCell>,
    <HeaderCell sortKey="description">Description</HeaderCell>,
    <HeaderCell
      sortKey="tags"
      sortFn={(a: ITransaction, b: ITransaction) => {
        const aTags = a.tags.map((t) => t.name).join(", ");
        const bTags = b.tags.map((t) => t.name).join(", ");
        return aTags.localeCompare(bTags);
      }}
    >
      Tags
    </HeaderCell>,
    <HeaderCell sortable={false} align="right">
      Actions
    </HeaderCell>,
  ];

  return (
    <Table
      data={data}
      defaultSort={{ sortKey: "occurredAt", direction: "desc" }}
      headerCells={headerCells}
    >
      {(sortedData) =>
        sortedData.map((expense) => (
          <TableRow key={expense.id} className="group">
            <BodyCell>
              <span className="text-text font-medium">
                {searchQuery
                  ? highlightText(expense.name, searchQuery)
                  : expense.name}
              </span>
            </BodyCell>
            <BodyCell className="text-right">
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
                {formatDate(expense.occurredAt)}
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
              {expense.tags.length > 0 ? (
                <div className="flex gap-1 flex-wrap">
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
              ) : (
                <span className="text-sm text-text-muted">—</span>
              )}
            </BodyCell>
            <BodyCell className="text-right">
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
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
            </BodyCell>
          </TableRow>
        ))
      }
    </Table>
  );
}
