import type { ITransaction } from "@/features/shared/validation/schemas";
import {
  defaultDateFilter,
  defaultPriceFilter,
  TransactionFilters,
  type ITransactionFilterValues,
} from "@/features/transaction/components/transaction-filters";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-import/transaction-csv-import-dialog";
import {
  useDeleteIncome,
  useIncomes,
} from "@/features/transaction/hooks/useTransactions";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyContainer } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownDivider } from "@/features/ui/dropdown/dropdown-divider";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { formatMonthYear } from "@/features/util/date/date-helpers";
import { useMemo, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowTrendingUp,
  HiArrowUpTray,
  HiPlus,
} from "react-icons/hi2";
import { exportTransactionsToCsv } from "../../utils/export-csv";
import { AddOrCreateIncomeDialog } from "./add-or-create-income-dialog";
import { IncomeTable } from "./income-table";

export function IncomeOverview() {
  const [filters, setFilters] = useState<ITransactionFilterValues>({
    dateFilter: defaultDateFilter,
    priceFilter: defaultPriceFilter,
    searchQuery: "",
    tagFilter: [],
  });

  const { dateFilter, priceFilter, searchQuery, tagFilter } = filters;

  // Fetch incomes with date filter (backend filtering)
  // Only pass date filters if not "allTime"
  const { data, isLoading, error } = useIncomes(
    dateFilter.type !== "allTime" && (dateFilter.from || dateFilter.to)
      ? ({
          from: dateFilter.from,
          to: dateFilter.to,
        } as Parameters<typeof useIncomes>[0])
      : undefined
  );
  const allIncomes = data?.data ?? [];

  const { mutate: deleteIncome } = useDeleteIncome();
  const toast = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<
    ITransaction | undefined
  >(undefined);

  // Client-side filtering for price, tags, and search
  const incomes = useMemo(() => {
    return allIncomes.filter((income) => {
      // Price filter
      if (priceFilter.min !== undefined || priceFilter.max !== undefined) {
        const amount = parseFloat(income.amount);
        if (priceFilter.min !== undefined && amount < priceFilter.min) {
          return false;
        }
        if (priceFilter.max !== undefined && amount > priceFilter.max) {
          return false;
        }
      }

      // Tag filter
      if (tagFilter.length > 0) {
        const incomeTagIds = income.tags.map((tag) => tag.id);
        const hasMatchingTag = tagFilter.some((tagId) =>
          incomeTagIds.includes(tagId)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = income.name.toLowerCase().includes(query);
        const descriptionMatch = income.description
          ?.toLowerCase()
          .includes(query);
        const tagMatch = income.tags.some((tag) =>
          tag.name.toLowerCase().includes(query)
        );
        const amountMatch = income.amount.includes(query);

        if (!nameMatch && !descriptionMatch && !tagMatch && !amountMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allIncomes, priceFilter, tagFilter, searchQuery]);

  const handleCreateIncome = () => {
    setSelectedIncome(undefined);
    setIsIncomeDialogOpen(true);
  };

  const handleEditIncome = (income: ITransaction) => {
    setSelectedIncome(income);
    setIsIncomeDialogOpen(true);
  };

  const handleDeleteClick = (income: ITransaction) => {
    setSelectedIncome(income);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedIncome) {
      deleteIncome(selectedIncome.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedIncome(undefined);
          toast.success("Income deleted successfully");
        },
        onError: () => {
          toast.error("Failed to delete income");
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedIncome(undefined);
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
    return (
      dateFilter.type === defaultDateFilter.type &&
      dateFilter.from === defaultDateFilter.from &&
      dateFilter.to === defaultDateFilter.to
    );
  }, [dateFilter]);

  const isEmpty = useMemo(() => {
    return (
      !isLoading &&
      !error &&
      incomes.length === 0 &&
      allIncomes.length === 0 &&
      isDefaultDateFilter
    );
  }, [incomes, allIncomes, isLoading, error]);

  const isEmptyWithFilters = useMemo(() => {
    return (
      !isLoading &&
      !error &&
      incomes.length === 0 &&
      allIncomes.length > 0 &&
      !isDefaultDateFilter
    );
  }, [
    incomes,
    allIncomes,
    isLoading,
    error,
    searchQuery,
    tagFilter,
    isDefaultDateFilter,
  ]);

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface mb-4">
        <Title className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <HiArrowTrendingUp />
            <span>Incomes</span>
            <span className="text-sm text-text-muted font-normal self-end">
              ({getMonthDisplay()})
            </span>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              clicked={handleCreateIncome}
              variant="primary"
              size="sm">
              <HiPlus className="size-6" /> Add
            </Button>

            <Dropdown>
              <DropdownItem
                icon={<HiArrowDownTray />}
                clicked={() => setIsCsvImportDialogOpen(true)}>
                Import from CSV
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={<HiArrowUpTray />}
                clicked={() =>
                  exportTransactionsToCsv(
                    incomes,
                    ["Name", "Amount", "Date", "Description", "Tags"],
                    "incomes"
                  )
                }>
                Export from CSV
              </DropdownItem>
            </Dropdown>
          </div>
        </Title>
      </Container>

      {isLoading && (
        <Container>
          <p className="text-text-muted text-center">Loading incomes...</p>
        </Container>
      )}

      {error && (
        <Container>
          <p className="text-red-500 text-center">
            Error loading incomes: {error.message}
          </p>
        </Container>
      )}

      {isEmpty && (
        <EmptyContainer
          icon={<HiArrowTrendingUp />}
          emptyText={
            "No income entries yet. Start by adding your first income source."
          }
          button={{
            buttonText: "Add income",
            buttonAction: () => handleCreateIncome(),
          }}></EmptyContainer>
      )}

      {isEmptyWithFilters && (
        <EmptyContainer
          icon={<HiArrowTrendingUp />}
          emptyText={
            "No incomes match your filters. Try adjusting your search criteria or clearing your filters."
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

      {!isLoading && !error && incomes.length > 0 && (
        <Container>
          <TransactionFilters onFiltersChange={setFilters} />
          <IncomeTable
            data={incomes}
            searchQuery={searchQuery}
            onDelete={handleDeleteClick}
            onEdit={handleEditIncome}
          />
        </Container>
      )}

      <AddOrCreateIncomeDialog
        open={isIncomeDialogOpen}
        onOpenChange={setIsIncomeDialogOpen}
        transaction={selectedIncome}
      />

      <DeleteDialog
        title="Delete Income"
        content={`Are you sure you want to delete the income "${selectedIncome?.name}"? This action cannot be undone.`}
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
      />
    </>
  );
}
