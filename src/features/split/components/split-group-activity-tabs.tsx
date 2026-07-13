import { SplitExpenseListGrouped } from "@/features/split/components/split-expense-list-grouped";
import { SplitSettlementList } from "@/features/split/components/split-settlement-list";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import type { ISplitSettlement } from "@/features/split/utils/group-split-settlements-by-date";
import { Loading } from "@/features/ui/loading";
import { Tab } from "@/features/ui/tab/tab";
import { TabContent } from "@/features/ui/tab/tab-content";
import { TabGroup } from "@/features/ui/tab/tab-group";

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
  return (
    <TabGroup defaultValue="expenses">
      <Tab value="expenses">Expenses</Tab>
      <Tab value="settlements">Settlements</Tab>

      <TabContent value="expenses">
        {expensesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loading text="Loading expenses" />
          </div>
        ) : (
          <SplitExpenseListGrouped
            expenses={expenses}
            groupCurrency={groupCurrency}
            viewer={viewer}
            onEdit={onEditExpense}
            onDelete={onDeleteExpense}
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
            settlements={settlements}
            currency={groupCurrency}
            viewer={viewer}
            onEdit={onEditSettlement}
            onDelete={onDeleteSettlement}
          />
        )}
      </TabContent>
    </TabGroup>
  );
}
