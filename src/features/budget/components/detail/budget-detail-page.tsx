import {
  useBudget,
  useBudgetComparison,
  useDeleteBudget,
} from "@/features/budget/hooks/useBudgets";
import { buildBudgetTransactionLookup } from "@/features/budget/utils/budget-overview-helpers";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  IBudgetMonthlyBreakdown,
  ITransaction,
} from "@/features/shared/validation/schemas";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { AddOrEditTransactionDialog } from "@/features/transaction/components/add-or-edit-transaction-dialog";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { useQueryClient } from "@tanstack/react-query";
import { useScrollPosition } from "@/features/shared/hooks/use-scroll-position";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Loading } from "@/features/ui/loading";
import { Tab } from "@/features/ui/tab/tab";
import { TabContent } from "@/features/ui/tab/tab-content";
import { Tabs } from "@/features/ui/tab/tabs";
import { useToast } from "@/features/ui/toast";
import { getBudgetPeriodViewLabel } from "@/features/budget/utils/budget-period-context";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineCurrencyEuro } from "react-icons/hi2";
import { BudgetDetailHeader } from "./budget-detail-header";
import { BudgetDetailTagsContainer } from "./budget-detail-tags-container";
import { BudgetSubscriptionsTab } from "./budget-subscriptions-tab";
import { BudgetSummaryContainer } from "./budget-summary-container";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type IBudgetDetailPageProps = {
  budgetId: string;
};

export function BudgetDetailPage({ budgetId }: IBudgetDetailPageProps) {
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId();
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);
  const { data: budget, isLoading: budgetLoading } = useBudget(budgetId);
  const { data: comparison, isLoading: comparisonLoading } =
    useBudgetComparison(budgetId);
  const { mutate: deleteBudget } = useDeleteBudget();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [monthSelection, setMonthSelection] = useState<{
    budgetId: string;
    key: string | null;
  }>({ budgetId, key: null });
  const selectedMonthKey =
    monthSelection.budgetId === budgetId ? monthSelection.key : null;
  const setSelectedMonthKey = (key: string | null) => {
    setMonthSelection({ budgetId, key });
  };
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    ITransaction | undefined
  >(undefined);
  const expandedHeaderRef = useRef<HTMLDivElement>(null);
  const [isSticky, setExpandedHeaderElement] = useScrollPosition();

  const hasMultipleMonths =
    comparison && comparison.monthlyBreakdown.length > 1;

  const selectedBreakdown: IBudgetMonthlyBreakdown | null = useMemo(() => {
    if (!selectedMonthKey || !comparison) return null;
    return (
      comparison.monthlyBreakdown.find(
        (mb) => `${mb.year}-${mb.month}` === selectedMonthKey
      ) ?? null
    );
  }, [selectedMonthKey, comparison]);

  useEffect(() => {
    if (expandedHeaderRef.current) {
      setExpandedHeaderElement(expandedHeaderRef.current);
    }
  }, [setExpandedHeaderElement]);

  const periodViewLabel = useMemo(() => {
    if (!comparison) return null;

    return getBudgetPeriodViewLabel(comparison.budget, {
      selectedBreakdown,
      monthCount: comparison.monthlyBreakdown.length,
      monthLabels: MONTH_LABELS,
    });
  }, [comparison, selectedBreakdown]);

  const selectedMonthLabel = useMemo(() => {
    if (!selectedBreakdown) return null;
    return `${MONTH_LABELS[selectedBreakdown.month - 1]} ${selectedBreakdown.year}`;
  }, [selectedBreakdown]);

  const monthOptions = useMemo(() => {
    if (!comparison) return [];
    return [
      { value: "all", label: "All months (total)" },
      ...comparison.monthlyBreakdown.map((mb) => ({
        value: `${mb.year}-${mb.month}`,
        label: `${MONTH_LABELS[mb.month - 1]} ${mb.year}`,
      })),
    ];
  }, [comparison]);

  const handleBack = () => {
    navigate({
      to: "/$workspaceId/budgets",
      params: { workspaceId: workspaceRouteParam },
    });
  };

  const handleEdit = () => {
    navigate({
      to: "/$workspaceId/budgets/$budgetId/edit",
      params: { workspaceId: workspaceRouteParam, budgetId },
    });
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteBudget(budgetId, {
      onSuccess: (data) => {
        setIsDeleteDialogOpen(false);
        if (!isOfflineMutationPlaceholder(data)) {
          toast.success("Budget deleted successfully");
        }
        navigate({
          to: "/$workspaceId/budgets",
          params: { workspaceId: workspaceRouteParam },
        });
      },
      onError: () => {
        toast.error("Failed to delete budget");
      },
    });
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  const transactionLookup = useMemo(
    () => (comparison ? buildBudgetTransactionLookup(comparison) : new Map()),
    [comparison],
  );

  const handleTransactionClick = (transaction: ITransaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleSubscriptionTransactionClick = (transactionId: string) => {
    const transaction = transactionLookup.get(transactionId);
    if (!transaction) {
      toast.error("Transaction not found in this budget period");
      return;
    }
    handleTransactionClick(transaction);
  };

  const handleTransactionDialogSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.budgetComparison(workspaceId, budgetId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.budgetsOverview(workspaceId),
    });
    queryClient.invalidateQueries({
      queryKey: ["subscriptions", workspaceId],
    });
  };

  if (budgetLoading || comparisonLoading) {
    return (
      <Container>
        <Loading text="Loading budget details" />
      </Container>
    );
  }

  if (!budget || !comparison) {
    return (
      <Container>
        <EmptyPage
          icon={HiOutlineCurrencyEuro}
          emptyText="Budget not found"
          button={{
            buttonContent: "Back to budgets",
            clicked: handleBack,
          }}
        />
      </Container>
    );
  }

  return (
    <>
      <div ref={expandedHeaderRef} className="h-0" />

      <BudgetDetailHeader
        budgetName={budget.name}
        isSticky={isSticky}
        onBack={handleBack}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        hasMultipleMonths={!!hasMultipleMonths}
        selectedMonthKey={selectedMonthKey}
        selectedMonthLabel={selectedMonthLabel}
        periodViewLabel={periodViewLabel}
        monthOptions={monthOptions}
        onMonthChange={setSelectedMonthKey}
      />

      <Container>
        <Tabs defaultValue="details">
          <Tab value="details">Details</Tab>
          <Tab value="subscriptions">Subscriptions</Tab>

          <TabContent value="details">
            <BudgetSummaryContainer
              totals={
                selectedBreakdown
                  ? selectedBreakdown.totals
                  : comparison.totals
              }
              currency={comparison.budget.currency}
              alerts={selectedBreakdown ? [] : comparison.alerts}
              periodViewLabel={periodViewLabel}
            />

            <BudgetDetailTagsContainer
              items={comparison.items}
              budget={comparison.budget}
              monthlyBreakdown={selectedBreakdown}
              onTransactionClick={handleTransactionClick}
            />
          </TabContent>

          <TabContent value="subscriptions">
            <BudgetSubscriptionsTab
              budget={comparison.budget}
              onTransactionClick={handleSubscriptionTransactionClick}
            />
          </TabContent>
        </Tabs>
      </Container>

      <AddOrEditTransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        transaction={selectedTransaction}
        onSuccess={handleTransactionDialogSuccess}
      />

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Budget"
        content={`Are you sure you want to delete "${budget.name}"? This action cannot be undone.`}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: handleDeleteCancel,
          },
          {
            buttonContent: "Delete",
            clicked: handleDeleteConfirm,
            variant: "danger",
          },
        ]}
      />
    </>
  );
}
