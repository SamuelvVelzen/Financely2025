import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import type {
  ICurrency,
  IPaymentMethod,
  ITransaction,
} from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-import/transaction-csv-import-dialog";
import { useTransactionFilters } from "@/features/transaction/hooks/useTransactionFilters";
import {
  useDeleteTransaction,
  useInfiniteTransactions,
} from "@/features/transaction/hooks/useTransactions";
import type { ITransactionFilterState } from "@/features/transaction/utils/transaction-filter-model";
import { serializeFilterStateToQuery } from "@/features/transaction/utils/transaction-filter-model";
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
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  HiArrowDownTray,
  HiArrowsRightLeft,
  HiArrowUpTray,
  HiPlus,
} from "react-icons/hi2";
import { exportTransactionsToCsv } from "../utils/export-csv";
import { AddOrCreateTransactionDialog } from "./add-or-create-transaction-dialog";
import { TransactionFilters } from "./transaction-filters";
import { TransactionListGrouped } from "./transaction-list-grouped";

const PAGE_SIZE = 20;

interface ITransactionOverviewProps {
  initialState?: Partial<ITransactionFilterState>;
}

export function TransactionOverview({
  initialState,
}: ITransactionOverviewProps) {
  const navigate = useNavigate();

  // Use shared filter state hook (includes form)
  const {
    filterState,
    form,
    setDateFilter,
    setPriceFilter,
    setTagFilter,
    clearAllFilters,
    hasActiveFilters,
  } = useTransactionFilters({ initialState });

  const searchQuery = form.watch("searchQuery") ?? "";

  // Debounce filter state for URL updates to avoid excessive navigation
  const debouncedFilterState = useDebouncedValue(filterState, 300);

  // Sync filter state changes to query params
  useEffect(() => {
    const queryParams = serializeFilterStateToQuery(debouncedFilterState);
    navigate({
      to: "/transactions",
      search: queryParams,
      replace: true, // Use replace to avoid cluttering browser history
    });
  }, [debouncedFilterState, navigate]);

  // Build query with all filters (backend filtering) - no page param for infinite query
  const query = useMemo((): Parameters<typeof useInfiniteTransactions>[0] => {
    // Transaction type logic: if both selected or empty, send undefined (show all)
    // If only one selected, send that single type
    let typeFilter: "EXPENSE" | "INCOME" | undefined = undefined;
    if (
      filterState.transactionTypeFilter.length === 1 &&
      (filterState.transactionTypeFilter[0] === "EXPENSE" ||
        filterState.transactionTypeFilter[0] === "INCOME")
    ) {
      typeFilter = filterState.transactionTypeFilter[0] as "EXPENSE" | "INCOME";
    }

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
      // Transaction type filter
      type: typeFilter,
      // Tag filter
      tagIds:
        filterState.tagFilter.length > 0 ? filterState.tagFilter : undefined,
      // Search filter
      q: filterState.searchQuery.trim() || undefined,
      // Amount filter
      minAmount: filterState.priceFilter.min?.toString(),
      maxAmount: filterState.priceFilter.max?.toString(),
      // Payment method filter
      paymentMethod:
        filterState.paymentMethodFilter.length > 0
          ? (filterState.paymentMethodFilter as IPaymentMethod[])
          : undefined,
      // Currency filter
      currency:
        filterState.currencyFilter.length > 0
          ? (filterState.currencyFilter as ICurrency[])
          : undefined,
    };
  }, [filterState]);

  // Debounce query to reduce API calls during rapid filter changes
  const debouncedQuery = useDebouncedValue(query, 300);

  // Fetch transactions with infinite scroll (both expenses and incomes)
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteTransactions(debouncedQuery);

  // Flatten all pages into a single array
  const transactions = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  const { mutate: deleteTransaction } = useDeleteTransaction();
  const toast = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isCsvImportDialogOpen, setIsCsvImportDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    ITransaction | undefined
  >(undefined);

  // Tags for filter dropdown
  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const orderedTags = useOrderedData(tags);

  const handleCreateTransaction = () => {
    setSelectedTransaction(undefined);
    setIsTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction: ITransaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionDialogOpen(true);
  };

  const handleDeleteClick = (transaction: ITransaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedTransaction) {
      deleteTransaction(selectedTransaction.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedTransaction(undefined);
          toast.success(
            `${selectedTransaction.type === "EXPENSE" ? "Expense" : "Income"} deleted successfully`
          );
        },
        onError: () => {
          toast.error("Failed to delete transaction");
        },
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setSelectedTransaction(undefined);
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
    return (
      !isLoading && !error && transactions.length === 0 && !hasActiveFilters
    );
  }, [transactions, isLoading, error, hasActiveFilters]);

  const isEmptyWithFilters = useMemo(() => {
    return (
      !isLoading && !error && transactions.length === 0 && hasActiveFilters
    );
  }, [transactions, isLoading, error, hasActiveFilters]);

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface">
        <Title className="grid grid-cols-[1fr_auto] gap-2 items-center mb-3">
          <div className="flex gap-2 items-center">
            <HiArrowsRightLeft />
            <span>Transactions</span>
            <span className="text-sm text-text-muted font-normal self-end">
              ({getMonthDisplay()})
            </span>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              clicked={handleCreateTransaction}
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
                    transactions,
                    ["Name", "Amount", "Date", "Description", "Tags", "Type"],
                    "transactions"
                  )
                }>
                Export to CSV
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
            <Loading text="Loading transactions" />
          </div>
        )}

        {isEmpty && (
          <EmptyPage
            icon={HiArrowsRightLeft}
            emptyText={
              "No transactions yet. Start by adding your first expense or income."
            }
            button={{
              buttonContent: "Add transaction",
              clicked: handleCreateTransaction,
            }}></EmptyPage>
        )}

        {isEmptyWithFilters && (
          <EmptyPage
            icon={HiArrowsRightLeft}
            emptyText={
              "No transactions match your filters. Try adjusting your search criteria or clearing your filters."
            }
            button={{
              buttonContent: "Clear filters",
              clicked: clearAllFilters,
            }}
          />
        )}

        {!isEmpty && !isEmptyWithFilters && (
          <TransactionListGrouped
            data={transactions}
            searchQuery={searchQuery}
            onDelete={handleDeleteClick}
            onEdit={handleEditTransaction}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
      </Container>

      <AddOrCreateTransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        transaction={selectedTransaction}
      />

      <DeleteDialog
        title={`Delete ${selectedTransaction?.type === "EXPENSE" ? "Expense" : "Income"}`}
        content={`Are you sure you want to delete the ${selectedTransaction?.type === "EXPENSE" ? "expense" : "income"} "${selectedTransaction?.name}"? This action cannot be undone.`}
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
