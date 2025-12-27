"use client";

import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type { IBudgetComparison } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { Accordion } from "@/features/ui/accordion/accordion";
import { Badge } from "@/features/ui/badge/badge";
import { List } from "@/features/ui/list/list";
import { cn } from "@/features/util/cn";
import { useMemo, useState } from "react";
import { HiChevronDown, HiSquares2X2 } from "react-icons/hi2";
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
    const map = new Map<
      string,
      {
        name: string;
        color: string | null;
        transactionType: "EXPENSE" | "INCOME" | null;
      }
    >();
    tags.forEach((tag) => {
      map.set(tag.id, {
        name: tag.name,
        color: tag.color,
        transactionType: tag.transactionType ?? null,
      });
    });
    return map;
  }, [tags]);

  // Group items by transaction type
  const groupedItems = useMemo(() => {
    const expenseItems: typeof comparison.items = [];
    const incomeItems: typeof comparison.items = [];
    const bothItems: typeof comparison.items = [];

    comparison.items.forEach((itemComparison) => {
      const tagId = itemComparison.item.tagId;

      // Misc items (tagId: null) always go in "both" section
      if (tagId === null) {
        bothItems.push(itemComparison);
        return;
      }

      // Get transaction type from tag map
      const tagInfo = tagMap.get(tagId);
      const transactionType = tagInfo?.transactionType ?? null;

      if (transactionType === "EXPENSE") {
        expenseItems.push(itemComparison);
      } else if (transactionType === "INCOME") {
        incomeItems.push(itemComparison);
      } else {
        // transactionType is null, goes in "both" section
        bothItems.push(itemComparison);
      }
    });

    // Sort misc items (tagId: null) to the bottom within bothItems
    bothItems.sort((a, b) => {
      const aTagId = a.item.tagId;
      const bTagId = b.item.tagId;
      if (aTagId === null && bTagId === null) return 0;
      if (aTagId === null) return 1;
      if (bTagId === null) return -1;
      return 0;
    });

    return { expenseItems, incomeItems, bothItems };
  }, [comparison.items, tagMap]);

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Render a single budget comparison item
  const renderBudgetItem = (itemComparison: (typeof comparison.items)[0]) => {
    const itemId = itemComparison.item.id;
    const tagId = itemComparison.item.tagId;
    const isExpanded = expandedItems.has(itemId);
    const percentage = itemComparison.percentage;
    const expected = parseFloat(itemComparison.expected);
    const actual = parseFloat(itemComparison.actual);

    // Get tag info from tag map or transactions
    let tagColor: string | null = null;
    let displayTagName: string;

    if (tagId === null) {
      displayTagName = "Miscellaneous";
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

    const hasTransactions = itemComparison.transactions.length > 0;

    return (
      <div className="border-b border-border last:border-b-0">
        <div
          className={cn(
            "p-3",
            hasTransactions && "cursor-pointer hover:bg-surface-hover"
          )}
          onClick={hasTransactions ? () => toggleItem(itemId) : undefined}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0 h-10">
              {tagColor ? (
                <div className="size-5 flex items-center justify-center">
                  <span
                    className="size-3 rounded-full block"
                    style={{ backgroundColor: tagColor }}></span>
                </div>
              ) : (
                <HiSquares2X2 className="size-5 shrink-0 text-text-muted" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{displayTagName}</div>
                {!isExpanded && (
                  <div className="text-xs text-text-muted">
                    {itemComparison.transactions.length} transaction
                    {itemComparison.transactions.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-stretch gap-6">
              <div className="text-right min-w-[80px]">
                <div className="text-xs text-text-muted">Expected</div>
                <div className="text-sm font-medium">
                  {formatCurrency(
                    itemComparison.expected,
                    comparison.budget.currency
                  )}
                </div>
              </div>
              <div className="text-right min-w-[80px]">
                <div className="text-xs text-text-muted">Actual</div>
                <div
                  className={cn(
                    "text-sm font-medium",
                    getStatusColor(percentage)
                  )}>
                  {formatCurrency(
                    itemComparison.actual,
                    comparison.budget.currency
                  )}
                </div>
              </div>
              <div className="text-right min-w-[80px]">
                <div className="text-xs text-text-muted">Difference</div>
                <div
                  className={cn(
                    "text-sm font-medium",
                    getStatusColor(percentage)
                  )}>
                  {formatCurrency(
                    itemComparison.difference,
                    comparison.budget.currency
                  )}
                </div>
              </div>
              <div className="w-24 justify-between items-center flex flex-col">
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
                {getStatusBadge(percentage)}
              </div>
              <div className="w-4 self-center">
                {hasTransactions && (
                  <HiChevronDown
                    className={cn(
                      "size-4 text-text-muted transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && itemComparison.transactions.length > 0 && (
          <div className="border-t border-border px-3 py-2 bg-surface-hover">
            <List
              data={itemComparison.transactions}
              getItemKey={(tx) => tx.id}
              className="border border-border">
              {(tx) => (
                <div className="flex items-center justify-between p-2 bg-background">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {tx.name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(tx.occurredAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right text-sm font-medium">
                    {formatCurrency(tx.amount, comparison.budget.currency)}
                  </div>
                </div>
              )}
            </List>
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 80) return "text-text";
    if (percentage <= 100) return "text-warning";
    return "text-danger";
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage < 80) return <Badge>On Track</Badge>;
    if (percentage <= 100) return <Badge variant="warning">Near Limit</Badge>;
    return <Badge variant="danger">Over Budget</Badge>;
  };

  const totalExpected = parseFloat(comparison.totals.totalExpected);
  const totalActual = parseFloat(comparison.totals.totalActual);
  const totalPercentage =
    totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-4 border border-border rounded-lg bg-surface">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Budget Summary</h3>
          {getStatusBadge(totalPercentage)}
        </div>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <div className="text-xs text-text-muted mb-0.5">Expected</div>
            <div className="text-lg font-semibold">
              {formatCurrency(
                comparison.totals.totalExpected,
                comparison.budget.currency
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-0.5">Actual</div>
            <div
              className={cn(
                "text-lg font-semibold",
                getStatusColor(totalPercentage)
              )}>
              {formatCurrency(
                comparison.totals.totalActual,
                comparison.budget.currency
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted mb-0.5">Difference</div>
            <div
              className={cn(
                "text-lg font-semibold",
                getStatusColor(totalPercentage)
              )}>
              {formatCurrency(
                comparison.totals.totalDifference,
                comparison.budget.currency
              )}
            </div>
          </div>
        </div>
        <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
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

      {/* Alerts */}
      {comparison.alerts.length > 0 && (
        <BudgetAlerts
          alerts={comparison.alerts}
          onAddBudgetItem={onAddBudgetItem}
        />
      )}

      {/* Per-Tag Comparisons */}

      <h3 className="text-lg font-semibold">Per-Tag Breakdown</h3>

      {/* Expense Tags Section */}
      {groupedItems.expenseItems.length > 0 && (
        <Accordion
          title="Expense Tags"
          defaultOpen={true}>
          <List
            data={groupedItems.expenseItems}
            getItemKey={(item) => item.item.id}
            className="border border-border">
            {(itemComparison) => renderBudgetItem(itemComparison)}
          </List>
        </Accordion>
      )}

      {/* Income Tags Section */}
      {groupedItems.incomeItems.length > 0 && (
        <Accordion
          title="Income Tags"
          defaultOpen={true}>
          <List
            data={groupedItems.incomeItems}
            getItemKey={(item) => item.item.id}
            className="border border-border">
            {(itemComparison) => renderBudgetItem(itemComparison)}
          </List>
        </Accordion>
      )}

      {/* Tags for Both Section (includes Miscellaneous) */}
      {groupedItems.bothItems.length > 0 && (
        <Accordion
          title="Tags for Both"
          defaultOpen={true}>
          <List
            data={groupedItems.bothItems}
            getItemKey={(item) => item.item.id}
            className="border border-border">
            {(itemComparison) => renderBudgetItem(itemComparison)}
          </List>
        </Accordion>
      )}
    </div>
  );
}
