import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import type {
  IBudgetComparison,
  IBudgetMonthlyBreakdown,
  ITransaction,
} from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { Accordion } from "@/features/ui/accordion/accordion";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { cn } from "@/features/util/cn";
import { formatDate } from "@/features/util/date/date-helpers";
import { useEffect, useMemo, useState } from "react";
import { HiChevronRight } from "react-icons/hi";
import { HiSquares2X2 } from "react-icons/hi2";
import {
  BudgetStatusBadge,
  getProgressBarColor,
  getStatusColor,
  type IBudgetCategoryType,
} from "./budget-status-badge";

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
  onTransactionClick?: (transaction: ITransaction) => void;
};

export function BudgetDetailTagsContainer({
  items,
  budget,
  monthlyBreakdown,
  onTransactionClick,
}: IBudgetDetailTagsContainerProps) {
  const [selectedItem, setSelectedItem] = useState<IDisplayItem | null>(null);
  const [isTransactionsDialogOpen, setIsTransactionsDialogOpen] =
    useState(false);

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

  const getDisplayTagName = (item: IDisplayItem) => {
    if (item.tagId === null) {
      return item.categoryType === "INCOME"
        ? "Miscellaneous (Income)"
        : "Miscellaneous (Expense)";
    }

    const tagInfo = tagMap.get(item.tagId);
    if (tagInfo) {
      return tagInfo.name;
    }

    const firstTx = item.transactions[0];
    return firstTx?.primaryTag?.name ?? `Tag ${item.tagId}`;
  };

  const getTagColor = (item: IDisplayItem) => {
    if (item.tagId === null) {
      return null;
    }

    const tagInfo = tagMap.get(item.tagId);
    if (tagInfo) {
      return tagInfo.color;
    }

    return item.transactions[0]?.primaryTag?.color ?? null;
  };

  const openTransactionsDialog = (item: IDisplayItem) => {
    if (item.transactions.length === 0) {
      return;
    }
    setSelectedItem(item);
    setIsTransactionsDialogOpen(true);
  };

  const handleTransactionsDialogOpenChange = (open: boolean) => {
    setIsTransactionsDialogOpen(open);
    if (!open) {
      setSelectedItem(null);
    }
  };

  // Keep transaction list in sync after edits (comparison refetch)
  useEffect(() => {
    if (!selectedItem || !isTransactionsDialogOpen) return;
    const updated = displayItems.find((item) => item.id === selectedItem.id);
    if (updated) {
      setSelectedItem(updated);
    }
  }, [displayItems, selectedItem?.id, isTransactionsDialogOpen]);

  const handleTransactionClick = (tx: ITransaction) => {
    onTransactionClick?.(tx);
  };

  const renderBudgetItem = (
    item: IDisplayItem,
    categoryType: IBudgetCategoryType,
  ) => {
    const percentage = item.percentage;
    const displayTagName = getDisplayTagName(item);
    const tagColor = getTagColor(item);
    const hasTransactions = item.transactions.length > 0;

    return (
      <div className="border-b border-border last:border-b-0">
        <ListItem
          className="flex-col overflow-hidden"
          clicked={
            hasTransactions ? () => openTransactionsDialog(item) : undefined
          }>
          <div className="flex items-center justify-between gap-4 w-full">
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
                <div className="text-xs text-text-muted">
                  {item.transactions.length} transaction
                  {item.transactions.length !== 1 ? "s" : ""}
                </div>
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
                    getStatusColor(percentage, categoryType),
                  )}>
                  {formatCurrency(item.actual, budget.currency)}
                </div>
              </div>
              <div className="text-right min-w-[80px]">
                <div className="text-xs text-text-muted">Difference</div>
                <div
                  className={cn(
                    "text-sm font-medium",
                    getStatusColor(percentage, categoryType),
                  )}>
                  {formatCurrency(item.difference, budget.currency)}
                </div>
              </div>
              <div className="w-24 justify-between items-center flex flex-col">
                <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      getProgressBarColor(percentage, categoryType),
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <BudgetStatusBadge
                  percentage={percentage}
                  categoryType={categoryType}
                />
              </div>
              <div className="w-4 self-center">
                {hasTransactions && (
                  <HiChevronRight className="size-4 text-text-muted" />
                )}
              </div>
            </div>
          </div>
        </ListItem>
      </div>
    );
  };

  const selectedTagName = selectedItem
    ? getDisplayTagName(selectedItem)
    : "Transactions";

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
            {(item) => renderBudgetItem(item, "EXPENSE")}
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
            {(item) => renderBudgetItem(item, "INCOME")}
          </List>
        </Accordion>
      )}

      <Dialog
        title={selectedTagName}
        open={isTransactionsDialogOpen}
        onOpenChange={handleTransactionsDialogOpenChange}
        size="lg"
        footerButtons={[
          {
            buttonContent: "Close",
            clicked: () => handleTransactionsDialogOpenChange(false),
          },
        ]}>
        {selectedItem && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-text-muted">
              <span>
                {selectedItem.transactions.length} transaction
                {selectedItem.transactions.length !== 1 ? "s" : ""}
              </span>
              <span>
                {formatCurrency(selectedItem.actual, budget.currency)} actual
              </span>
            </div>
            <List
              data={selectedItem.transactions}
              getItemKey={(tx) => tx.id}>
              {(tx) => (
                <ListItem
                  className="p-2"
                  clicked={() => handleTransactionClick(tx)}>
                  <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {tx.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {formatDate(tx.transactionDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right text-sm font-medium">
                        {formatCurrency(tx.amount, budget.currency)}
                      </div>
                      <HiChevronRight className="size-4 text-text-muted" />
                    </div>
                  </div>
                </ListItem>
              )}
            </List>
          </div>
        )}
      </Dialog>
    </>
  );
}
