"use client";

import {
  useBudgets,
  useDeleteBudget,
} from "@/features/budget/hooks/useBudgets";
import type { IBudget } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { List } from "@/features/ui/list/list";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { HiPlus } from "react-icons/hi2";
import { BudgetCard } from "./budget-card";

export function BudgetOverview() {
  const { data, isLoading, error } = useBudgets();
  const budgets = data?.data ?? [];
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

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalBudgets = budgets.length;
    const totalExpected = budgets.reduce((sum: number, budget: IBudget) => {
      return (
        sum +
        budget.items.reduce((itemSum: number, item) => {
          return itemSum + parseFloat(item.expectedAmount);
        }, 0)
      );
    }, 0);

    return {
      totalBudgets,
      totalExpected,
    };
  }, [budgets]);

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-text-muted">Loading budgets...</div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-danger">Failed to load budgets</div>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface mb-4">
        <div className="flex items-center justify-between">
          <Title>Budgets</Title>
          <Button
            clicked={handleCreateBudget}
            variant="primary"
            size="sm">
            <HiPlus className="size-4" /> Create Budget
          </Button>
        </div>
      </Container>

      <Container>
        {/* Summary Cards */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-border rounded-lg bg-surface">
              <div className="text-sm text-text-muted mb-1">Total Budgets</div>
              <div className="text-2xl font-semibold">
                {summaryStats.totalBudgets}
              </div>
            </div>
            <div className="p-4 border border-border rounded-lg bg-surface">
              <div className="text-sm text-text-muted mb-1">Total Expected</div>
              <div className="text-2xl font-semibold">
                {summaryStats.totalExpected.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })}
              </div>
            </div>
            <div className="p-4 border border-border rounded-lg bg-surface">
              <div className="text-sm text-text-muted mb-1">Active Periods</div>
              <div className="text-2xl font-semibold">
                {
                  budgets.filter((b: IBudget) => {
                    const now = new Date();
                    const start = new Date(b.startDate);
                    const end = new Date(b.endDate);
                    return now >= start && now <= end;
                  }).length
                }
              </div>
            </div>
          </div>
        )}

        {/* Budgets Grid */}
        {budgets.length === 0 ? (
          <EmptyPage
            emptyText="Create your first budget to start tracking your expenses and income."
            button={{
              buttonContent: "Create Budget",
              clicked: handleCreateBudget,
            }}
          />
        ) : (
          <List data={budgets}>
            {(budget: IBudget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onView={handleViewBudget}
                onEdit={handleEditBudget}
                onDelete={handleDeleteClick}
              />
            )}
          </List>
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
      </Container>
    </>
  );
}
