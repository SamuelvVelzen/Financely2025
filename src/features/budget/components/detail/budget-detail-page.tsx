"use client";

import { ROUTES } from "@/config/routes";
import {
  useBudget,
  useBudgetComparison,
  useDeleteBudget,
} from "@/features/budget/hooks/useBudgets";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { HiArrowLeft, HiPencil, HiTrash } from "react-icons/hi2";
import { BudgetComparisonView } from "./budget-comparison-view";

type IBudgetDetailPageProps = {
  budgetId: string;
};

export function BudgetDetailPage({ budgetId }: IBudgetDetailPageProps) {
  const navigate = useNavigate();
  const { data: budget, isLoading: budgetLoading } = useBudget(budgetId);
  const { data: comparison, isLoading: comparisonLoading } =
    useBudgetComparison(budgetId);
  const { mutate: deleteBudget } = useDeleteBudget();
  const toast = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleBack = () => {
    navigate({ to: ROUTES.BUDGETS });
  };

  const handleEdit = () => {
    navigate({
      to: "/budgets/$budgetId/edit",
      params: { budgetId },
    });
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    deleteBudget(budgetId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        toast.success("Budget deleted successfully");
        navigate({ to: ROUTES.BUDGETS });
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-text-muted">Loading budget details...</div>
        </div>
      </Container>
    );
  }

  if (!budget || !comparison) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-danger">Budget not found</div>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface mb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              clicked={handleBack}
              aria-label="Back to budgets">
              <HiArrowLeft className="w-4 h-4" />
            </Button>
            <Title>{budget.name}</Title>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              clicked={handleEdit}>
              <HiPencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="danger"
              clicked={handleDeleteClick}>
              <HiTrash className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </Container>
      <Container>
        {/* Comparison View */}
        <BudgetComparisonView comparison={comparison} />

        {/* Delete Dialog */}
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
      </Container>
    </>
  );
}
