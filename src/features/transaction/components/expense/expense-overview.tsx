import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-csv-import-dialog";
import {
  TransactionFilters,
  type TransactionFilterValues,
} from "@/features/transaction/components/transaction-filters";
import {
  useDeleteExpense,
  useExpenses,
} from "@/features/transaction/hooks/useTransactions";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Title } from "@/features/ui/typography/title";
import { formatCurrency } from "@/util/currency/currencyhelpers";
import { formatMonthYear } from "@/util/date/date-helpers";
import { useMemo, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowTrendingDown,
  HiPencil,
  HiPlus,
  HiTrash,
} from "react-icons/hi2";
import { AddOrCreateExpenseDialog } from "./add-or-create-expense-dialog";

export function ExpenseOverview() {
  const [filters, setFilters] = useState<TransactionFilterValues>({
    dateFilter: {
      type: "allTime",
      from: undefined,
      to: undefined,
    },
    priceFilter: {
      min: undefined,
      max: undefined,
    },
    searchQuery: "",
    tagFilter: [],
  });

  const { dateFilter, priceFilter, searchQuery, tagFilter } = filters;

  // Fetch expenses with date filter (backend filtering)
  // Only pass date filters if not "allTime"
  const { data, isLoading, error } = useExpenses(
    dateFilter.type !== "allTime" && (dateFilter.from || dateFilter.to)
      ? ({
          from: dateFilter.from,
          to: dateFilter.to,
        } as Parameters<typeof useExpenses>[0])
      : undefined
  );
  const allExpenses = data?.data ?? [];

  const { mutate: deleteExpense } = useDeleteExpense();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<
    ITransaction | undefined
  >(undefined);

  const { highlightText } = useHighlightText();

  // Client-side filtering for price, tags, and search
  const expenses = useMemo(() => {
    return allExpenses.filter((expense) => {
      // Price filter
      if (priceFilter.min !== undefined || priceFilter.max !== undefined) {
        const amount = parseFloat(expense.amount);
        if (priceFilter.min !== undefined && amount < priceFilter.min) {
          return false;
        }
        if (priceFilter.max !== undefined && amount > priceFilter.max) {
          return false;
        }
      }

      // Tag filter
      if (tagFilter.length > 0) {
        const expenseTagIds = expense.tags.map((tag) => tag.id);
        const hasMatchingTag = tagFilter.some((tagId) =>
          expenseTagIds.includes(tagId)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = expense.name.toLowerCase().includes(query);
        const descriptionMatch = expense.description
          ?.toLowerCase()
          .includes(query);
        const tagMatch = expense.tags.some((tag) =>
          tag.name.toLowerCase().includes(query)
        );
        const amountMatch = expense.amount.includes(query);

        if (!nameMatch && !descriptionMatch && !tagMatch && !amountMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allExpenses, priceFilter, tagFilter, searchQuery]);

  const handleCreateExpense = () => {
    setSelectedExpense(undefined);
    setIsExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense: ITransaction) => {
    setSelectedExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleDeleteClick = (expenseId: string) => {
    setSelectedExpense(allExpenses.find((expense) => expense.id === expenseId));
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedExpense) {
      deleteExpense(selectedExpense.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedExpense(undefined);
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedExpense(undefined);
  };

  // Format date
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get month display text from date filter
  const getMonthDisplay = (): string => {
    if (dateFilter.type === "allTime") {
      return "All Time";
    }
    if (dateFilter.type === "thisMonth") {
      return formatMonthYear(new Date());
    }
    if (dateFilter.type === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return formatMonthYear(lastMonth);
    }
    if (dateFilter.type === "custom" && dateFilter.from) {
      return formatMonthYear(dateFilter.from);
    }
    return formatMonthYear(new Date());
  };

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface mb-4">
        <Title className="flex items-center justify-between mb-4">
          <div className="flex gap-2 items-center">
            <HiArrowTrendingDown />
            <div className="flex items-center gap-2">
              <span>Expenses</span>
              <span className="text-sm text-text-muted font-normal">
                ({getMonthDisplay()})
              </span>
            </div>
          </div>

          <Dropdown>
            <DropdownItem
              icon={<HiPlus />}
              clicked={() => handleCreateExpense()}
            >
              Add expense
            </DropdownItem>
            <DropdownItem
              icon={<HiArrowDownTray />}
              clicked={() => setIsCsvImportDialogOpen(true)}
            >
              Import from CSV
            </DropdownItem>
          </Dropdown>
        </Title>

        <TransactionFilters onFiltersChange={setFilters} />
      </Container>

      {isLoading && (
        <Container>
          <p className="text-text-muted text-center">Loading expenses...</p>
        </Container>
      )}

      {error && (
        <Container>
          <p className="text-red-500 text-center">
            Error loading expenses: {error.message}
          </p>
        </Container>
      )}

      {!isLoading &&
        !error &&
        expenses.length === 0 &&
        allExpenses.length === 0 && (
          <EmptyContainer
            icon={<HiArrowTrendingDown />}
            emptyText={"No expenses yet. Start by adding your first expense."}
            button={{
              buttonText: "Add expense",
              buttonAction: () => handleCreateExpense(),
            }}
          ></EmptyContainer>
        )}

      {!isLoading &&
        !error &&
        expenses.length === 0 &&
        allExpenses.length > 0 && (
          <EmptyContainer
            icon={<HiArrowTrendingDown />}
            emptyText={
              "No expenses match your filters. Try adjusting your search criteria."
            }
          />
        )}

      {!isLoading && !error && expenses.length > 0 && (
        <Container>
          <List data={expenses}>
            {(expense) => (
              <ListItem className="group">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-text font-medium">
                      {searchQuery
                        ? highlightText(expense.name, searchQuery)
                        : expense.name}
                    </span>
                    <span className="text-text font-semibold">
                      {searchQuery
                        ? highlightText(
                            formatCurrency(expense.amount, expense.currency),
                            searchQuery
                          )
                        : formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-muted">
                    <span>{formatDate(expense.occurredAt)}</span>
                    {expense.description && (
                      <span className="text-text-muted">
                        {searchQuery
                          ? highlightText(expense.description, searchQuery)
                          : expense.description}
                      </span>
                    )}
                    {expense.tags.length > 0 && (
                      <div className="flex gap-1">
                        {expense.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-0.5 bg-surface-hover rounded text-xs"
                          >
                            {searchQuery
                              ? highlightText(tag.name, searchQuery)
                              : tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity">
                  <IconButton
                    clicked={() => handleEditExpense(expense)}
                    className="text-text-muted hover:text-text p-1"
                  >
                    <HiPencil className="w-5 h-5" />
                  </IconButton>
                  <IconButton
                    clicked={() => handleDeleteClick(expense.id)}
                    className="text-danger hover:text-danger-hover p-1"
                  >
                    <HiTrash className="w-5 h-5" />
                  </IconButton>
                </div>
              </ListItem>
            )}
          </List>
        </Container>
      )}

      <AddOrCreateExpenseDialog
        open={isExpenseDialogOpen}
        onOpenChange={setIsExpenseDialogOpen}
        transaction={selectedExpense}
      />

      <DeleteDialog
        title="Delete Expense"
        content={`Are you sure you want to delete the expense "${selectedExpense?.name}"? This action cannot be undone.`}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
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

      <TransactionCsvImportDialog
        open={isCsvImportDialogOpen}
        onOpenChange={setIsCsvImportDialogOpen}
        onSuccess={() => {
          // Transactions will be refetched automatically via query invalidation
        }}
        defaultType="EXPENSE"
      />
    </>
  );
}
