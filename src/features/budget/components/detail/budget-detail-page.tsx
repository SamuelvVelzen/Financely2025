import {
  useBudget,
  useBudgetComparison,
  useDeleteBudget,
} from "@/features/budget/hooks/useBudgets";
import type { IBudgetMonthlyBreakdown } from "@/features/shared/validation/schemas";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
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
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

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

        {hasMultipleMonths && (
          <div className="mt-3 max-w-xs">
            <SelectDropdown
              value={selectedMonthKey ?? "all"}
              onChange={(val) =>
                setSelectedMonthKey(
                  val === "all" ? null : (val as string)
                )
              }
              options={[
                { value: "all", label: "All Months" },
                ...comparison.monthlyBreakdown.map((mb) => ({
                  value: `${mb.year}-${mb.month}`,
                  label: `${MONTH_LABELS[mb.month - 1]} ${mb.year}`,
                })),
              ]}
              clearable={false}
            />
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
            />

            <BudgetDetailTagsContainer
              items={comparison.items}
              budget={comparison.budget}
              monthlyBreakdown={selectedBreakdown}
            />
          </TabContent>

          <TabContent value="subscriptions">
            <BudgetSubscriptionsTab
              budget={comparison.budget}
            />
          </TabContent>
        </Tabs>
      </Container>

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
