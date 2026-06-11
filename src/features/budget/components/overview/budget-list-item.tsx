import {
  getNetRemainingFromTotals,
  getNetRemainingStatus,
} from "@/features/budget/utils/budget-summary-helpers";
import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type {
  IBudget,
  IBudgetComparison,
} from "@/features/shared/validation/schemas";
import { IconButton } from "@/features/ui/button/icon-button";
import { ListItem } from "@/features/ui/list/list-item";
import { cn } from "@/features/util/cn";
import { formatDateRange } from "@/features/util/date/date-helpers";
import { HiEye, HiPencil, HiTrash } from "react-icons/hi2";

type IBudgetListItemProps = {
  budget: IBudget;
  totals?: IBudgetComparison["totals"];
  searchQuery?: string;
  onView?: (budget: IBudget) => void;
  onEdit?: (budget: IBudget) => void;
  onDelete?: (budget: IBudget) => void;
};

export function BudgetListItem({
  budget,
  totals,
  searchQuery,
  onView,
  onEdit,
  onDelete,
}: IBudgetListItemProps) {
  const { highlightText } = useHighlightText();

  const netTotals = totals ? getNetRemainingFromTotals(totals) : null;
  const netStatus = netTotals
    ? getNetRemainingStatus(
        netTotals.actualRemaining,
        netTotals.expectedRemaining,
      )
    : null;

  const tagCountLabel = `${budget.items.length} ${
    budget.items.length === 1 ? "tag" : "tags"
  }`;

  return (
    <ListItem
      className="group relative py-3"
      clicked={() => {
        if (onView) {
          onView(budget);
        }
      }}>
      <div className="flex w-full min-w-0 items-center justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">
              {highlightText(budget.name, searchQuery)}
            </span>
            <span className="text-text-muted shrink-0">·</span>
            <span className="text-sm text-text-muted truncate">
              {formatDateRange(budget.startDate, budget.endDate)}
            </span>
          </div>
          <div className="text-xs text-text-muted mt-0.5">{tagCountLabel}</div>
        </div>

        {netTotals ? (
          <div className="shrink-0 text-right">
            <div
              className={cn("font-semibold text-lg", netStatus?.colorClass)}>
              {formatCurrency(
                netTotals.actualRemaining.toString(),
                budget.currency,
              )}
            </div>
            <div className="text-xs text-text-muted">
              of{" "}
              {formatCurrency(
                netTotals.expectedRemaining.toString(),
                budget.currency,
              )}{" "}
              expected
            </div>
          </div>
        ) : (
          <div className="shrink-0 text-sm text-text-muted">—</div>
        )}
      </div>

      <div
        className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg bg-surface/95 px-1 opacity-0 shadow-sm group-hover:opacity-100 motion-safe:transition-opacity"
        onClick={(e) => e.stopPropagation()}>
        {onView && (
          <IconButton
            clicked={() => onView(budget)}
            size="sm"
            ariaLabel="View budget">
            <HiEye className="size-4" />
          </IconButton>
        )}
        {onEdit && (
          <IconButton
            clicked={() => onEdit(budget)}
            size="sm"
            ariaLabel="Edit budget">
            <HiPencil className="size-4" />
          </IconButton>
        )}
        {onDelete && (
          <IconButton
            clicked={() => onDelete(budget)}
            variant="danger"
            size="sm"
            ariaLabel="Delete budget">
            <HiTrash className="size-4" />
          </IconButton>
        )}
      </div>
    </ListItem>
  );
}
