import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { SplitExpenseListGrouped } from "@/features/split/components/split-expense-list-grouped";
import { SplitSettlementList } from "@/features/split/components/split-settlement-list";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import type { ISplitSettlement } from "@/features/split/utils/group-split-settlements-by-date";
import { SearchInput } from "@/features/ui/input/search-input";
import { Loading } from "@/features/ui/loading";
import { Tab } from "@/features/ui/tab/tab";
import { TabContent } from "@/features/ui/tab/tab-content";
import { TabGroup } from "@/features/ui/tab/tab-group";
import { matchesSearchQuery } from "@/features/util/matches-search-query";
import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useMemo, useState } from "react";

export function SplitGroupActivityTabs({
  expenses,
  settlements,
  groupCurrency,
  expensesLoading,
  settlementsLoading,
  viewer,
  onEditExpense,
  onDeleteExpense,
  onEditSettlement,
  onDeleteSettlement,
}: {
  expenses: ISplitExpense[];
  settlements: ISplitSettlement[];
  groupCurrency: string;
  expensesLoading?: boolean;
  settlementsLoading?: boolean;
  viewer?: { userId: string; memberId: string; role: string };
  onEditExpense?: (expense: ISplitExpense) => void;
  onDeleteExpense?: (expense: ISplitExpense) => void;
  onEditSettlement?: (settlement: ISplitSettlement) => void;
  onDeleteSettlement?: (settlement: ISplitSettlement) => void;
}) {
  const { isMobile } = useResponsive();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("expenses");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) =>
        matchesSearchQuery(
          debouncedSearchQuery,
          expense.description,
          expense.paidByDisplayName,
          ...expense.shares.map((share) => share.displayName),
        ),
      ),
    [expenses, debouncedSearchQuery],
  );

  const filteredSettlements = useMemo(
    () =>
      settlements.filter((settlement) =>
        matchesSearchQuery(
          debouncedSearchQuery,
          settlement.fromDisplayName,
          settlement.toDisplayName,
          settlement.note,
        ),
      ),
    [settlements, debouncedSearchQuery],
  );

  const searchPlaceholder =
    activeTab === "settlements"
      ? "Search settlements"
      : "Search expenses";

  return (
    <TabGroup
      defaultValue="expenses"
      onChangeTab={(_previous, next) => setActiveTab(next)}>
      <Tab value="expenses">Expenses</Tab>
      <Tab value="settlements">Settlements</Tab>

      <div className="mb-3 mt-3">
        <SearchInput
          alwaysExpanded
          size={isMobile ? "sm" : "md"}
          value={searchQuery}
          onChange={(v) => setSearchQuery(v ?? "")}
          placeholder={searchPlaceholder}
        />
      </div>

      <TabContent value="expenses">
        {expensesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loading text="Loading expenses" />
          </div>
        ) : (
          <SplitExpenseListGrouped
            expenses={filteredExpenses}
            groupCurrency={groupCurrency}
            viewer={viewer}
            onEdit={onEditExpense}
            onDelete={onDeleteExpense}
            emptyText={
              debouncedSearchQuery.trim() && expenses.length > 0
                ? "No expenses match your search."
                : undefined
            }
          />
        )}
      </TabContent>

      <TabContent value="settlements">
        {settlementsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loading text="Loading settlements" />
          </div>
        ) : (
          <SplitSettlementList
            settlements={filteredSettlements}
            currency={groupCurrency}
            viewer={viewer}
            onEdit={onEditSettlement}
            onDelete={onDeleteSettlement}
            emptyText={
              debouncedSearchQuery.trim() && settlements.length > 0
                ? "No settlements match your search."
                : undefined
            }
          />
        )}
      </TabContent>
    </TabGroup>
  );
}
