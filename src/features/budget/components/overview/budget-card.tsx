"use client";

import type { IBudget } from "@/features/shared/validation/schemas";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { ListItem } from "@/features/ui/list/list-item";
import { cn } from "@/features/util/cn";
import { format } from "date-fns";
import { HiEye, HiPencil, HiTrash } from "react-icons/hi2";

type IBudgetCardProps = {
  budget: IBudget;
  comparison?: {
    totalExpected: string;
    totalActual: string;
    percentage: number;
  };
  onView?: (budget: IBudget) => void;
  onEdit?: (budget: IBudget) => void;
  onDelete?: (budget: IBudget) => void;
};

export function BudgetCard({
  budget,
  comparison,
  onView,
  onEdit,
  onDelete,
}: IBudgetCardProps) {
  const percentage = comparison?.percentage ?? 0;
  const totalExpected = comparison?.totalExpected
    ? parseFloat(comparison.totalExpected)
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

  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);

  return (
    <ListItem className="flex-col items-stretch p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold truncate mb-1.5">
            {budget.name}
          </h3>
          <div className="text-sm text-text-muted">
            {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
          </div>
        </div>
        {comparison && (
          <div className="ml-4 shrink-0">{getStatusBadge(percentage)}</div>
        )}
      </div>

      {comparison ? (
        <div className="mb-5">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                Budgeted
              </div>
              <div className="text-lg font-semibold">
                {totalExpected.toLocaleString(undefined, {
                  style: "currency",
                  currency: budget.currency,
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                Spent
              </div>
              <div
                className={cn(
                  "text-lg font-semibold",
                  getStatusColor(percentage)
                )}>
                {parseFloat(comparison.totalActual).toLocaleString(undefined, {
                  style: "currency",
                  currency: budget.currency,
                })}
              </div>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-muted">Progress</span>
              <span className={cn("font-semibold", getStatusColor(percentage))}>
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-surface-hover rounded-full h-2.5 overflow-hidden">
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
          </div>
          <div className="text-xs text-text-muted mt-2">
            {budget.items.length} {budget.items.length === 1 ? "tag" : "tags"}{" "}
            budgeted
          </div>
        </div>
      ) : (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                Total Expected
              </div>
              <div className="text-lg font-semibold">
                {totalExpected.toLocaleString(undefined, {
                  style: "currency",
                  currency: budget.currency,
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">
                Tags
              </div>
              <div className="text-lg font-semibold">{budget.items.length}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-5 border-t border-border">
        {onView && (
          <Button
            variant="secondary"
            size="sm"
            clicked={() => onView(budget)}
            className="flex-1">
            <HiEye className="size-4 mr-2" />
            View
          </Button>
        )}
        {onEdit && (
          <IconButton
            size="sm"
            clicked={() => onEdit(budget)}
            aria-label="Edit budget">
            <HiPencil />
          </IconButton>
        )}
        {onDelete && (
          <IconButton
            variant="danger"
            size="sm"
            clicked={() => onDelete(budget)}
            aria-label="Delete budget">
            <HiTrash />
          </IconButton>
        )}
      </div>
    </ListItem>
  );
}
