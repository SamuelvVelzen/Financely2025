"use client";

import { ROUTES } from "@/config/routes";
import {
  useBudget,
  useBudgetComparison,
  useDeleteBudget,
} from "@/features/budget/hooks/useBudgets";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Loading } from "@/features/ui/loading";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  HiArrowLeft,
  HiOutlineCurrencyEuro,
  HiPencil,
  HiTrash,
} from "react-icons/hi2";
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
      <Container className="sticky top-0 z-10 bg-surface mb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              clicked={handleBack}
              aria-label="Back to budgets">
              <HiArrowLeft className="size-4" />
            </Button>
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
      </Container>
      <Container>
        {/* Comparison View */}
        <BudgetComparisonView comparison={comparison} />
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
