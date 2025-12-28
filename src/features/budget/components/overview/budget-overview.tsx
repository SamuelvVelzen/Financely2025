"use client";

import {
  useBudgets,
  useBudgetsOverview,
  useDeleteBudget,
} from "@/features/budget/hooks/useBudgets";
import type { IBudget } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { List } from "@/features/ui/list/list";
import { Loading } from "@/features/ui/loading";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HiOutlineCurrencyEuro, HiPlus } from "react-icons/hi2";
import { BudgetListItem } from "./budget-list-item";
import { BudgetSummaryCards } from "./budget-summary-cards";

export function BudgetOverview() {
  const {
    data: budgetsData,
    isLoading: isLoadingBudgets,
    error: errorBudgets,
  } = useBudgets();
  const {
    data: overviewData,
    isLoading: isLoadingOverview,
    error: errorOverview,
  } = useBudgetsOverview();
  const budgets = budgetsData?.data ?? [];
  const { mutate: deleteBudget } = useDeleteBudget();
  const toast = useToast();
  const navigate = useNavigate();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<IBudget | undefined>(
    undefined
  );

  const handleCreateBudget = () => {
    navigate({ to: "/budgets/new" });
  };

  const handleEditBudget = (budget: IBudget) => {
    navigate({
      to: "/budgets/$budgetId/edit",
      params: { budgetId: budget.id },
    });
  };

  const handleViewBudget = (budget: IBudget) => {
    navigate({
      to: "/budgets/$budgetId",
      params: { budgetId: budget.id },
    });
  };

  const handleDeleteClick = (budget: IBudget) => {
    setSelectedBudget(budget);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedBudget) {
      deleteBudget(selectedBudget.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedBudget(undefined);
          toast.success("Budget deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete budget");
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedBudget(undefined);
  };

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface">
        <div className="flex items-center justify-between">
          <Title>
            <div className="flex gap-2 items-center">
              <HiOutlineCurrencyEuro />
              <span>Budgets</span>
            </div>
          </Title>
          <Button
            clicked={handleCreateBudget}
            variant="primary"
            size="sm">
            <HiPlus className="size-4" /> Add Budget
          </Button>
        </div>
      </Container>

      <Container>
        <BudgetSummaryCards
          overviewData={overviewData}
          isLoading={isLoadingOverview}
          error={errorOverview}
        />
      </Container>

      {
        <Container>
          {isLoadingBudgets && (
            <div className="flex items-center justify-center py-8">
              <Loading text="Loading budgets" />
            </div>
          )}
          {errorBudgets && (
            <div className="flex items-center justify-center py-8">
              <div className="text-danger">Failed to load budgets</div>
            </div>
          )}

          {budgets.length > 0 && (
            <List data={budgets}>
              {(budget: IBudget) => (
                <BudgetListItem
                  key={budget.id}
                  budget={budget}
                  onView={handleViewBudget}
                  onEdit={handleEditBudget}
                  onDelete={handleDeleteClick}
                />
              )}
            </List>
          )}
        </Container>
      }

      {!isLoadingOverview && !errorOverview && budgets.length === 0 && (
        <Container>
          <EmptyPage
            icon={HiOutlineCurrencyEuro}
            emptyText="Create your first budget to start tracking your expenses and income."
            button={{
              buttonContent: "Create Budget",
              clicked: handleCreateBudget,
            }}
          />
        </Container>
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Budget"
        content={`Are you sure you want to delete "${selectedBudget?.name}"? This action cannot be undone.`}
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
