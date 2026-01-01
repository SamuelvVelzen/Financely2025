import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type { ITransaction } from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-import/transaction-csv-import-dialog";
import { useTransactionFilters } from "@/features/transaction/hooks/useTransactionFilters";
import {
  useDeleteIncome,
  useInfiniteIncomes,
} from "@/features/transaction/hooks/useTransactions";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownDivider } from "@/features/ui/dropdown/dropdown-divider";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { Loading } from "@/features/ui/loading/loading";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { formatMonthYear } from "@/features/util/date/date-helpers";
import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useMemo, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowTrendingUp,
  HiArrowUpTray,
  HiPlus,
} from "react-icons/hi2";
import { exportTransactionsToCsv } from "../../utils/export-csv";
import { TransactionFilters } from "../transaction-filters";
import { AddOrCreateIncomeDialog } from "./add-or-create-income-dialog";
import { IncomeListGrouped } from "./income-list-grouped";

const PAGE_SIZE = 20;

export function IncomeOverview() {
  // Use shared filter state hook (includes form)
  const {
    filterState,
    form,
    setDateFilter,
    setPriceFilter,
    setTagFilter,
    clearAllFilters,
    hasActiveFilters,
    defaultFilterState,
  } = useTransactionFilters();

  const searchQuery = form.watch("searchQuery") ?? "";

  // Build query with all filters (backend filtering) - no page param for infinite query
  const query = useMemo((): Parameters<typeof useInfiniteIncomes>[0] => {
    return {
      limit: PAGE_SIZE,
      // Date filter
      from:
        filterState.dateFilter.type !== "allTime"
          ? filterState.dateFilter.from
          : undefined,
      to:
        filterState.dateFilter.type !== "allTime"
          ? filterState.dateFilter.to
          : undefined,
      // Tag filter
      tagIds:
        filterState.tagFilter.length > 0 ? filterState.tagFilter : undefined,
      // Search filter
      q: filterState.searchQuery.trim() || undefined,
      // Amount filter
      minAmount: filterState.priceFilter.min?.toString(),
      maxAmount: filterState.priceFilter.max?.toString(),
    };
  }, [filterState]);

  // Debounce query to reduce API calls during rapid filter changes
  const debouncedQuery = useDebouncedValue(query, 300);

  // Fetch incomes with infinite scroll
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteIncomes(debouncedQuery);

  // Flatten all pages into a single array
  const incomes = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const { mutate: deleteIncome } = useDeleteIncome();
  const toast = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<
    ITransaction | undefined
  >(undefined);

  // Tags for filter dropdown
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const orderedTags = useOrderedData(tags);

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
    if (filterState.dateFilter.type === "allTime") {
      return "All Time";
    }
    if (filterState.dateFilter.type === "thisMonth") {
      return formatMonthYear(new Date());
    }
    if (filterState.dateFilter.type === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return formatMonthYear(lastMonth);
    }
    if (
      filterState.dateFilter.type === "custom" &&
      filterState.dateFilter.from &&
      filterState.dateFilter.to
    ) {
      const from = formatMonthYear(filterState.dateFilter.from);
      const to = formatMonthYear(filterState.dateFilter.to);
      return `${from} - ${to}`;
    }
    return formatMonthYear(new Date());
  };

  const isEmpty = useMemo(() => {
    return !isLoading && !error && incomes.length === 0 && !hasActiveFilters;
  }, [incomes, isLoading, error, hasActiveFilters]);

  const isEmptyWithFilters = useMemo(() => {
    return !isLoading && !error && incomes.length === 0 && hasActiveFilters;
  }, [incomes, isLoading, error, hasActiveFilters]);

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface pb-0">
        <Title className="grid grid-cols-[1fr_auto] gap-2 items-center mb-3">
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

        <TransactionFilters
          form={form}
          dateFilter={filterState.dateFilter}
          onDateFilterChange={setDateFilter}
          priceFilter={filterState.priceFilter}
          onPriceFilterChange={setPriceFilter}
          tags={orderedTags}
          onClearAll={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </Container>

      <Container>
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loading text="Loading incomes" />
          </div>
        )}

        {isEmpty && (
          <EmptyPage
            icon={HiArrowTrendingUp}
            emptyText={
              "No income entries yet. Start by adding your first income source."
            }
            button={{
              buttonContent: "Add income",
              clicked: handleCreateIncome,
            }}></EmptyPage>
        )}

        {isEmptyWithFilters && (
          <EmptyPage
            icon={HiArrowTrendingUp}
            emptyText={
              "No incomes match your filters. Try adjusting your search criteria or clearing your filters."
            }
            button={{
              buttonContent: "Clear filters",
              clicked: clearAllFilters,
            }}
          />
        )}

        {!isEmpty && !isEmptyWithFilters && (
          <IncomeListGrouped
            data={incomes}
            searchQuery={searchQuery}
            onDelete={handleDeleteClick}
            onEdit={handleEditIncome}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
      </Container>

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
