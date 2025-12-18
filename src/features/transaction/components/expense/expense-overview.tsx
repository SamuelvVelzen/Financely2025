import type { ITransaction } from "@/features/shared/validation/schemas";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-csv-import-dialog";
import {
  defaultDateFilter,
  defaultPriceFilter,
  TransactionFilters,
  type ITransactionFilterValues,
} from "@/features/transaction/components/transaction-filters";
import {
  useDeleteExpense,
  useExpenses,
} from "@/features/transaction/hooks/useTransactions";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownDivider } from "@/features/ui/dropdown/dropdown-divider";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { Title } from "@/features/ui/typography/title";
import { formatMonthYear } from "@/util/date/date-helpers";
import { useMemo, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowTrendingDown,
  HiArrowUpTray,
  HiPlus,
} from "react-icons/hi2";
import { exportTransactionsToCsv } from "../../utils/export-csv";
import { AddOrCreateExpenseDialog } from "./add-or-create-expense-dialog";
import { ExpenseTable } from "./expense-table";

export function ExpenseOverview() {
  const [filters, setFilters] = useState<ITransactionFilterValues>({
    dateFilter: defaultDateFilter,
    priceFilter: defaultPriceFilter,
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

  const handleDeleteClick = (expense: ITransaction) => {
    setSelectedExpense(expense);
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

  const isDefaultDateFilter = useMemo(() => {
    return dateFilter.type === defaultDateFilter.type;
  }, [dateFilter]);

  const isEmpty = useMemo(() => {
    return (
      !isLoading &&
      !error &&
      expenses.length === 0 &&
      allExpenses.length === 0 &&
      isDefaultDateFilter
    );
  }, [expenses, allExpenses, isLoading, error, isDefaultDateFilter]);

  const isEmptyWithFilters = useMemo(() => {
    return (
      !isLoading &&
      !error &&
      expenses.length === 0 &&
      allExpenses.length > 0 &&
      !isDefaultDateFilter
    );
  }, [
    expenses,
    allExpenses,
    isLoading,
    error,
    searchQuery,
    tagFilter,
    isDefaultDateFilter,
  ]);

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface mb-4">
        <Title className="grid grid-cols-[1fr_auto] gap-2 items-center">
          <div className="flex gap-2 items-center">
            <HiArrowTrendingDown />
            <span>Expenses</span>
            <span className="text-sm text-text-muted font-normal self-end">
              ({getMonthDisplay()})
            </span>
          </div>

          <div className="flex gap-2 items-center">
            <Button clicked={handleCreateExpense} variant="primary" size="sm">
              <HiPlus className="size-6" /> Add
            </Button>

            <Dropdown>
              <DropdownItem
                icon={<HiArrowDownTray />}
                clicked={() => setIsCsvImportDialogOpen(true)}
              >
                Import from CSV
              </DropdownItem>

              <DropdownDivider />
              <DropdownItem
                icon={<HiArrowUpTray />}
                clicked={() =>
                  exportTransactionsToCsv(
                    expenses,
                    ["Name", "Amount", "Date", "Description", "Tags"],
                    "expenses"
                  )
                }
              >
                Export from CSV
              </DropdownItem>
            </Dropdown>
          </div>
        </Title>
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

      {isEmpty && (
        <EmptyContainer
          icon={<HiArrowTrendingDown />}
          emptyText={"No expenses yet. Start by adding your first expense."}
          button={{
            buttonText: "Add expense",
            buttonAction: () => handleCreateExpense(),
          }}
        ></EmptyContainer>
      )}

      {isEmptyWithFilters && (
        <EmptyContainer
          icon={<HiArrowTrendingDown />}
          emptyText={
            "No expenses match your filters. Try adjusting your search criteria or clearing your filters."
          }
          button={{
            buttonText: "Clear filters",
            buttonAction: () =>
              setFilters({
                dateFilter: defaultDateFilter,
                priceFilter: defaultPriceFilter,
                searchQuery: "",
                tagFilter: [],
              }),
          }}
        />
      )}

      {!isLoading && !error && expenses.length > 0 && (
        <Container>
          <TransactionFilters onFiltersChange={setFilters} />
          <ExpenseTable
            data={expenses}
            searchQuery={searchQuery}
            onDelete={handleDeleteClick}
            onEdit={handleEditExpense}
          ></ExpenseTable>
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
      />
    </>
  );
}
