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
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { LinkButton } from "@/features/ui/button/link-button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Loading } from "@/features/ui/loading";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Tab } from "@/features/ui/tab/tab";
import { TabContent } from "@/features/ui/tab/tab-content";
import { Tabs } from "@/features/ui/tab/tabs";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { getBudgetPeriodViewLabel } from "@/features/budget/utils/budget-period-context";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  HiArrowLeft,
  HiOutlineCurrencyEuro,
  HiPencil,
  HiTrash,
} from "react-icons/hi2";
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
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    ITransaction | undefined
  >(undefined);

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
    setSelectedMonthKey(null);
  }, [budgetId]);

  const periodViewLabel = useMemo(() => {
    if (!comparison) return null;

    return getBudgetPeriodViewLabel(comparison.budget, {
      selectedBreakdown,
      monthCount: comparison.monthlyBreakdown.length,
      monthLabels: MONTH_LABELS,
    });
  }, [comparison, selectedBreakdown]);

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
      <Container className="sticky top-0 z-10 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconButton
              clicked={handleBack}
              ariaLabel="Back to budgets">
              <HiArrowLeft className="size-4" />
            </IconButton>
            <Title>{budget.name}</Title>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              clicked={handleEdit}>
              <HiPencil className="size-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="danger"
              clicked={handleDeleteClick}>
              <HiTrash className="size-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {(hasMultipleMonths || periodViewLabel) && (
          <div className="mt-3">
            {hasMultipleMonths && (
              <div className="flex items-center gap-3">
                <div className="max-w-xs flex-1">
                  <SelectDropdown
                    value={selectedMonthKey ?? "all"}
                    onChange={(val) =>
                      setSelectedMonthKey(
                        val === "all" ? null : (val as string),
                      )
                    }
                    options={[
                      { value: "all", label: "All months (total)" },
                      ...comparison.monthlyBreakdown.map((mb) => ({
                        value: `${mb.year}-${mb.month}`,
                        label: `${MONTH_LABELS[mb.month - 1]} ${mb.year}`,
                      })),
                    ]}
                    clearable={false}
                  />
                </div>
                {selectedMonthKey && (
                  <LinkButton
                    variant="primary"
                    clicked={() => setSelectedMonthKey(null)}>
                    All months
                  </LinkButton>
                )}
              </div>
            )}
            {periodViewLabel && (
              <p className="text-sm text-text-muted mt-1.5">
                {periodViewLabel}
              </p>
            )}
          </div>
        )}
      </Container>

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
