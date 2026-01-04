import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type {
  IBudget,
  IBudgetComparison,
} from "@/features/shared/validation/schemas";
import { Badge } from "@/features/ui/badge/badge";
import { IconButton } from "@/features/ui/button/icon-button";
import { ListItem } from "@/features/ui/list/list-item";
import { cn } from "@/features/util/cn";
import { formatDateRange } from "@/features/util/date/date-helpers";
import { HiEye, HiPencil, HiTrash } from "react-icons/hi2";

type IBudgetListItemProps = {
  budget: IBudget;
  totals?: IBudgetComparison["totals"];
  onView?: (budget: IBudget) => void;
  onEdit?: (budget: IBudget) => void;
  onDelete?: (budget: IBudget) => void;
};

export function BudgetListItem({
  budget,
  totals,
  onView,
  onEdit,
  onDelete,
}: IBudgetListItemProps) {
  const percentage =
    totals && parseFloat(totals.totalExpected) > 0
      ? (parseFloat(totals.totalActual) / parseFloat(totals.totalExpected)) *
        100
      : 0;

  const totalExpected = totals?.totalExpected
    ? parseFloat(totals.totalExpected)
    : budget.items.reduce(
        (sum, item) => sum + parseFloat(item.expectedAmount),
        0
      );

  const getStatusColor = (pct: number) => {
    if (pct < 80) return "text-success";
    if (pct <= 100) return "text-warning";
    return "text-danger";
  };

  const getStatusBadge = (pct: number) => {
    if (pct < 80) return <Badge>On Track</Badge>;
    if (pct <= 100) return <Badge backgroundColor="#d97706">Approaching</Badge>;
    return <Badge backgroundColor="#dc2626">Over Budget</Badge>;
  };

  return (
    <ListItem
      className="group flex-col items-stretch gap-2 py-4"
      clicked={() => {
        if (onView) {
          onView(budget);
        }
      }}>
      {/* Top row: Name, Date, Status, Actions, Amount */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-text font-medium truncate">{budget.name}</span>
          <span className="text-text-muted">|</span>
          <span className="text-sm text-text-muted whitespace-nowrap">
            {formatDateRange(budget.startDate, budget.endDate)}
          </span>
          {totals && (
            <>
              <span className="text-text-muted">|</span>
              <div className="shrink-0">{getStatusBadge(percentage)}</div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Action buttons - visible on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
            {onView && (
              <IconButton
                clicked={() => onView(budget)}
                size="sm"
                aria-label="View budget">
                <HiEye className="size-4" />
              </IconButton>
            )}
            {onEdit && (
              <IconButton
                clicked={() => onEdit(budget)}
                size="sm"
                aria-label="Edit budget">
                <HiPencil className="size-4" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                clicked={() => onDelete(budget)}
                variant="danger"
                size="sm"
                aria-label="Delete budget">
                <HiTrash className="size-4" />
              </IconButton>
            )}
          </div>

          {/* Budgeted amount */}
          <span className="text-text font-semibold text-lg">
            {formatCurrency(totalExpected.toString(), budget.currency)}
          </span>
        </div>
      </div>

      {/* Progress bar and details - only show if comparison exists */}
      {totals && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">
              Spent:{" "}
              <span className={cn("font-medium", getStatusColor(percentage))}>
                {formatCurrency(totals.totalActual, budget.currency)}
              </span>
            </span>
            <span className={cn("font-semibold", getStatusColor(percentage))}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                percentage < 80
                  ? "bg-success"
                  : percentage >= 80 && percentage <= 100
                    ? "bg-warning"
                    : "bg-danger"
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-text-muted">
            {budget.items.length} {budget.items.length === 1 ? "tag" : "tags"}{" "}
            budgeted
          </div>
        </div>
      )}

      {/* Show tag count if no comparison */}
      {!totals && (
        <div className="text-xs text-text-muted">
          {budget.items.length} {budget.items.length === 1 ? "tag" : "tags"}{" "}
          budgeted
        </div>
      )}
    </ListItem>
  );
}
