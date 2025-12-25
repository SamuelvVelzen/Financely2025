"use client";

import type { IBudgetComparison } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { Badge } from "@/features/ui/badge/badge";
import { cn } from "@/features/util/cn";
import { useMemo, useState } from "react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { BudgetAlerts } from "./budget-alerts";

type IBudgetComparisonViewProps = {
  comparison: IBudgetComparison;
  onAddBudgetItem?: (tagId: string) => void;
};

export function BudgetComparisonView({
  comparison,
  onAddBudgetItem,
}: IBudgetComparisonViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];

  // Create tag map for quick lookup
  const tagMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null }>();
    tags.forEach((tag) => {
      map.set(tag.id, { name: tag.name, color: tag.color });
    });
    return map;
  }, [tags]);

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 80) return "text-success";
    if (percentage <= 100) return "text-warning";
    return "text-danger";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage < 80) return <Badge>On Track</Badge>;
    if (percentage <= 100)
      return <Badge backgroundColor="#d97706">Approaching Limit</Badge>;
    return <Badge backgroundColor="#dc2626">Over Budget</Badge>;
  };

  const totalExpected = parseFloat(comparison.totals.totalExpected);
  const totalActual = parseFloat(comparison.totals.totalActual);
  const totalPercentage =
    totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-6 border border-border rounded-lg bg-surface">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Budget Summary</h3>
          {getStatusBadge(totalPercentage)}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-sm text-text-muted mb-1">Total Expected</div>
            <div className="text-xl font-semibold">
              {totalExpected.toLocaleString(undefined, {
                style: "currency",
                currency: comparison.budget.currency,
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-1">Total Actual</div>
            <div
              className={cn(
                "text-xl font-semibold",
                getStatusColor(totalPercentage)
              )}>
              {totalActual.toLocaleString(undefined, {
                style: "currency",
                currency: comparison.budget.currency,
              })}
            </div>
          </div>
          <div>
            <div className="text-sm text-text-muted mb-1">Difference</div>
            <div
              className={cn(
                "text-xl font-semibold",
                getStatusColor(totalPercentage)
              )}>
              {parseFloat(comparison.totals.totalDifference).toLocaleString(
                undefined,
                {
                  style: "currency",
                  currency: comparison.budget.currency,
                  signDisplay: "always",
                }
              )}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span
              className={cn("font-medium", getStatusColor(totalPercentage))}>
              {totalPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-surface-hover rounded-full h-3 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                totalPercentage < 80
                  ? "bg-success"
                  : totalPercentage >= 80 && totalPercentage <= 100
                    ? "bg-warning"
                    : "bg-danger"
              )}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alerts */}
      {comparison.alerts.length > 0 && (
        <BudgetAlerts
          alerts={comparison.alerts}
          onAddBudgetItem={onAddBudgetItem}
        />
      )}

      {/* Per-Tag Comparisons */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Per-Tag Breakdown</h3>
        {comparison.items.map((itemComparison) => {
          const itemId = itemComparison.item.id;
          const tagId = itemComparison.item.tagId;
          const isExpanded = expandedItems.has(itemId);
          const percentage = itemComparison.percentage;
          const expected = parseFloat(itemComparison.expected);
          const actual = parseFloat(itemComparison.actual);
          const difference = parseFloat(itemComparison.difference);

          // Get tag info from tag map or transactions
          let tagColor: string | null = null;
          let displayTagName: string;

          if (tagId === null) {
            displayTagName = "Misc (Untagged Transactions)";
          } else {
            const tagInfo = tagMap.get(tagId);
            if (tagInfo) {
              displayTagName = tagInfo.name;
              tagColor = tagInfo.color;
            } else {
              // Fallback to transaction tag if available
              const firstTx = itemComparison.transactions[0];
              displayTagName = firstTx?.primaryTag?.name ?? `Tag ${tagId}`;
              tagColor = firstTx?.primaryTag?.color ?? null;
            }
          }

          return (
            <div
              key={itemId}
              className="border border-border rounded-lg bg-surface overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-surface-hover transition-colors"
                onClick={() => toggleItem(itemId)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {tagColor && (
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: tagColor }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {displayTagName}
                      </div>
                      <div className="text-sm text-text-muted">
                        {itemComparison.transactions.length} transaction
                        {itemComparison.transactions.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-text-muted">Expected</div>
                      <div className="font-medium">
                        {expected.toLocaleString(undefined, {
                          style: "currency",
                          currency: comparison.budget.currency,
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-text-muted">Actual</div>
                      <div
                        className={cn(
                          "font-medium",
                          getStatusColor(percentage)
                        )}>
                        {actual.toLocaleString(undefined, {
                          style: "currency",
                          currency: comparison.budget.currency,
                        })}
                      </div>
                    </div>
                    <div className="text-right w-24">
                      <div className="text-sm text-text-muted">Difference</div>
                      <div
                        className={cn(
                          "font-medium",
                          getStatusColor(percentage)
                        )}>
                        {difference.toLocaleString(undefined, {
                          style: "currency",
                          currency: comparison.budget.currency,
                          signDisplay: "always",
                        })}
                      </div>
                    </div>
                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-muted">
                          Progress
                        </span>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            getStatusColor(percentage)
                          )}>
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
                    </div>
                    {getStatusBadge(percentage)}
                    {isExpanded ? (
                      <HiChevronUp className="w-5 h-5 text-text-muted" />
                    ) : (
                      <HiChevronDown className="w-5 h-5 text-text-muted" />
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && itemComparison.transactions.length > 0 && (
                <div className="border-t border-border p-4 bg-surface-hover">
                  <div className="text-sm font-medium mb-2">Transactions</div>
                  <div className="space-y-2">
                    {itemComparison.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2 bg-background rounded">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{tx.name}</div>
                          <div className="text-sm text-text-muted">
                            {new Date(tx.occurredAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right font-medium">
                          {parseFloat(tx.amount).toLocaleString(undefined, {
                            style: "currency",
                            currency: tx.currency,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
