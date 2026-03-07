import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type {
  IBudgetComparison,
  IBudgetMonthlyBreakdown,
} from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { Accordion } from "@/features/ui/accordion/accordion";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { cn } from "@/features/util/cn";
import { formatDate } from "@/features/util/date/date-helpers";
import { useMemo, useState } from "react";
import { HiChevronDown } from "react-icons/hi";
import { HiSquares2X2 } from "react-icons/hi2";
import { BudgetStatusBadge, getStatusColor } from "./budget-status-badge";

type IDisplayItem = {
  id: string;
  tagId: string | null;
  categoryType?: "EXPENSE" | "INCOME" | null;
  expected: string;
  actual: string;
  difference: string;
  percentage: number;
  transactions: IBudgetComparison["items"][0]["transactions"];
};

type IBudgetDetailTagsContainerProps = {
  items: IBudgetComparison["items"];
  budget: IBudgetComparison["budget"];
  monthlyBreakdown?: IBudgetMonthlyBreakdown | null;
};

export function BudgetDetailTagsContainer({
  items,
  budget,
  monthlyBreakdown,
}: IBudgetDetailTagsContainerProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];

  const tagMap = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        color: string | null;
        transactionType: "EXPENSE" | "INCOME";
      }
    >();
    tags.forEach((tag) => {
      map.set(tag.id, {
        name: tag.name,
        color: tag.color,
        transactionType: tag.transactionType,
      });
    });
    return map;
  }, [tags]);

  // Normalize items to a common display shape; stable id = tagId or misc_${categoryType}
  const displayItems: IDisplayItem[] = useMemo(() => {
    if (monthlyBreakdown) {
      return monthlyBreakdown.items.map((mi) => ({
        id: mi.tagId ?? `misc_${mi.categoryType ?? "EXPENSE"}`,
        tagId: mi.tagId,
        categoryType: mi.categoryType ?? undefined,
        expected: mi.expected,
        actual: mi.actual,
        difference: mi.difference,
        percentage: mi.percentage,
        transactions: mi.transactions,
      }));
    }

    return items.map((ic) => ({
      id:
        ic.item.tagId !== null
          ? ic.item.id
          : `misc_${ic.item.categoryType ?? "EXPENSE"}`,
      tagId: ic.item.tagId,
      categoryType: ic.item.categoryType ?? undefined,
      expected: ic.expected,
      actual: ic.actual,
      difference: ic.difference,
      percentage: ic.percentage,
      transactions: ic.transactions,
    }));
  }, [items, monthlyBreakdown]);

  const groupedItems = useMemo(() => {
    const expenseItems: IDisplayItem[] = [];
    const incomeItems: IDisplayItem[] = [];

    displayItems.forEach((item) => {
      if (item.tagId === null) {
        if (item.categoryType === "INCOME") {
          incomeItems.push(item);
        } else {
          expenseItems.push(item);
        }
        return;
      }

      const tagInfo = tagMap.get(item.tagId);
      const transactionType = tagInfo?.transactionType;

      if (transactionType === "EXPENSE") {
        expenseItems.push(item);
      } else if (transactionType === "INCOME") {
        incomeItems.push(item);
      } else {
        expenseItems.push(item);
      }
    });

    // Tagged items first, misc last
    const sortTaggedFirst = (a: IDisplayItem, b: IDisplayItem) =>
      (a.tagId === null ? 1 : 0) - (b.tagId === null ? 1 : 0);
    expenseItems.sort(sortTaggedFirst);
    incomeItems.sort(sortTaggedFirst);

    return { expenseItems, incomeItems };
  }, [displayItems, tagMap]);

  const toggleItem = (itemId: string) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  const renderBudgetItem = (item: IDisplayItem) => {
    const isExpanded = expandedItemId === item.id;
    const percentage = item.percentage;

    let tagColor: string | null = null;
    let displayTagName: string;

    if (item.tagId === null) {
      displayTagName =
        item.categoryType === "INCOME"
          ? "Miscellaneous (Income)"
          : "Miscellaneous (Expense)";
    } else {
      const tagInfo = tagMap.get(item.tagId);
      if (tagInfo) {
        displayTagName = tagInfo.name;
        tagColor = tagInfo.color;
      } else {
        const firstTx = item.transactions[0];
        displayTagName = firstTx?.primaryTag?.name ?? `Tag ${item.tagId}`;
        tagColor = firstTx?.primaryTag?.color ?? null;
      }
    }

    const hasTransactions = item.transactions.length > 0;

    return (
      <div className="border-b border-border last:border-b-0">
        <ListItem
          className={cn("flex-col overflow-hidden", isExpanded && "p-0")}
          clicked={hasTransactions ? () => toggleItem(item.id) : undefined}>
          <div
            className={cn(
              "flex items-center justify-between gap-4 w-full",
              isExpanded && "p-3"
            )}>
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
                    {item.transactions.length} transaction
                    {item.transactions.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-stretch gap-6">
              <div className="text-right min-w-[80px]">
                <div className="text-xs text-text-muted">Expected</div>
                <div className="text-sm font-medium">
                  {formatCurrency(item.expected, budget.currency)}
                </div>
              </div>
              <div className="text-right min-w-[80px]">
                <div className="text-xs text-text-muted">Actual</div>
                <div
                  className={cn(
                    "text-sm font-medium",
                    getStatusColor(percentage)
                  )}>
                  {formatCurrency(item.actual, budget.currency)}
                </div>
              </div>
              <div className="text-right min-w-[80px]">
                <div className="text-xs text-text-muted">Difference</div>
                <div
                  className={cn(
                    "text-sm font-medium",
                    getStatusColor(percentage)
                  )}>
                  {formatCurrency(item.difference, budget.currency)}
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
                <BudgetStatusBadge percentage={percentage} />
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

          {isExpanded && item.transactions.length > 0 && (
            <div className="bg-surface-hover w-full">
              <div className="w-full h-1 border-t border-border"></div>
              <List
                data={item.transactions}
                getItemKey={(tx) => tx.id}
                className="w-full p-3">
                {(tx) => (
                  <ListItem className="p-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {tx.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {formatDate(tx.transactionDate)}
                        </div>
                      </div>
                      <div className="text-right text-sm font-medium">
                        {formatCurrency(tx.amount, budget.currency)}
                      </div>
                    </div>
                  </ListItem>
                )}
              </List>
            </div>
          )}
        </ListItem>
      </div>
    );
  };

  return (
    <>
      <h3 className="text-lg font-semibold">Per-Tag Breakdown</h3>

      {groupedItems.expenseItems.length > 0 && (
        <Accordion
          title="Expense Tags"
          defaultOpen={true}>
          <List
            data={groupedItems.expenseItems}
            getItemKey={(item) => item.id}>
            {(item) => renderBudgetItem(item)}
          </List>
        </Accordion>
      )}

      {groupedItems.incomeItems.length > 0 && (
        <Accordion
          title="Income Tags"
          defaultOpen={true}>
          <List
            data={groupedItems.incomeItems}
            getItemKey={(item) => item.id}>
            {(item) => renderBudgetItem(item)}
          </List>
        </Accordion>
      )}
    </>
  );
}
