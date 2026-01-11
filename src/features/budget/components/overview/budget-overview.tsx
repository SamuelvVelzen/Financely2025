import {
  useBudgets,
  useDeleteBudget,
} from "@/features/budget/hooks/useBudgets";
import type { IBudget } from "@/features/shared/validation/schemas";
import { useScrollPosition } from "@/features/shared/hooks/use-scroll-position";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { List } from "@/features/ui/list/list";
import { Loading } from "@/features/ui/loading";
import { useToast } from "@/features/ui/toast";
import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { HiOutlineCurrencyEuro } from "react-icons/hi2";
import { BudgetListItem } from "./budget-list-item";
import { BudgetOverviewHeader } from "./budget-overview-header";

export function BudgetOverview() {
  const navigate = useNavigate();
  const expandedHeaderRef = useRef<HTMLDivElement>(null);
  const [isSticky, setExpandedHeaderElement] = useScrollPosition();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Set up scroll detection for expanded header
  useEffect(() => {
    if (expandedHeaderRef.current) {
      setExpandedHeaderElement(expandedHeaderRef.current);
    }
  }, [setExpandedHeaderElement]);

  const query = useMemo(
    () => ({
      q: debouncedSearchQuery.trim() || undefined,
    }),
    [debouncedSearchQuery]
  );

  const {
    data: budgetsData,
    isLoading: isLoadingBudgets,
    error: errorBudgets,
  } = useBudgets(query);
  const budgets = budgetsData?.data ?? [];
  const { mutate: deleteBudget } = useDeleteBudget();
  const toast = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<IBudget | undefined>(
    undefined
  );

  // Calculate filter count
  const filterCount = useMemo(() => {
    return searchQuery.trim().length > 0 ? 1 : 0;
  }, [searchQuery]);

  const handleStickyFiltersClick = () => {
    // Scroll to top to show the search input
    expandedHeaderRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  const actions = useMemo(
    () => ({
      onCreateBudget: handleCreateBudget,
    }),
    [handleCreateBudget]
  );

  return (
    <>
      {/* Sentinel element - used to detect when header should become sticky */}
      <div ref={expandedHeaderRef} className="h-0" />

      <BudgetOverviewHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        actions={actions}
        isSticky={isSticky}
        filterCount={filterCount}
        onFiltersClick={handleStickyFiltersClick}
      />

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

        {!isLoadingBudgets && !errorBudgets && budgets.length === 0 && (
          <EmptyPage
            icon={HiOutlineCurrencyEuro}
            emptyText="Create your first budget to start tracking your expenses and income."
            button={{
              buttonContent: "Create Budget",
              clicked: handleCreateBudget,
            }}
          />
        )}

        {budgets.length > 0 && (
          <List data={budgets}>
            {(budget: IBudget) => (
              <BudgetListItem
                key={budget.id}
                budget={budget}
                searchQuery={searchQuery}
                onView={handleViewBudget}
                onEdit={handleEditBudget}
                onDelete={handleDeleteClick}
              />
            )}
          </List>
        )}
      </Container>

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
