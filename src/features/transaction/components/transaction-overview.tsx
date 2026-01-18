import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import { useScrollPosition } from "@/features/shared/hooks/use-scroll-position";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import type {
  ICurrency,
  IPaymentMethod,
  ITransaction,
} from "@/features/shared/validation/schemas";
import { useTags } from "@/features/tag/hooks/useTags";
import { TransactionCsvImportDialog } from "@/features/transaction/components/transaction-import/transaction-csv-import-dialog";
import { useTransactionFilterProps } from "@/features/transaction/hooks/use-transaction-filter-props";
import { useTransactionFilters } from "@/features/transaction/hooks/useTransactionFilters";
import {
  useDeleteTransaction,
  useInfiniteTransactions,
} from "@/features/transaction/hooks/useTransactions";
import { calculateFilterCount } from "@/features/transaction/utils/filter-count";
import type { ITransactionFilterState } from "@/features/transaction/utils/transaction-filter-model";
import { serializeFilterStateToQuery } from "@/features/transaction/utils/transaction-filter-model";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Loading } from "@/features/ui/loading/loading";
import { useToast } from "@/features/ui/toast";
import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiArrowsRightLeft } from "react-icons/hi2";
import { exportTransactionsToCsv } from "../utils/export-csv";
import { AddOrCreateTransactionDialog } from "./add-or-create-transaction-dialog";
import { TransactionListGrouped } from "./transaction-list-grouped";
import { TransactionOverviewHeader } from "./transaction-overview-header";

const PAGE_SIZE = 20;

interface ITransactionOverviewProps {
  initialState?: Partial<ITransactionFilterState>;
}

export function TransactionOverview({
  initialState,
}: ITransactionOverviewProps) {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const expandedHeaderRef = useRef<HTMLDivElement>(null);
  const [isSticky, setExpandedHeaderElement] = useScrollPosition();
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Use shared filter state hook (includes form)
  const {
    filterState,
    form,
    setDateFilter,
    setPriceFilter,
    setTagFilter,
    setSearchQuery,
    setTransactionTypeFilter,
    setPaymentMethodFilter,
    setCurrencyFilter,
    clearAllFilters,
    hasActiveFilters,
  } = useTransactionFilters({ initialState });

  // Calculate filter count for sticky header
  const filterCount = useMemo(
    () => calculateFilterCount(filterState),
    [filterState]
  );

  // Set up scroll detection for expanded header
  useEffect(() => {
    if (expandedHeaderRef.current) {
      setExpandedHeaderElement(expandedHeaderRef.current);
    }
  }, [setExpandedHeaderElement]);

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

  const handleStickyFiltersClick = () => {
    if (isMobile) {
      // On mobile, open the filter sheet
      setIsFilterSheetOpen(true);
    } else {
      // On desktop, scroll to top to show the filter dropdown
      expandedHeaderRef.current?.scrollIntoView({ behavior: "smooth" });
    }
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

  const handleCsvExport = useCallback(() => {
    exportTransactionsToCsv(
      transactions,
      ["Name", "Amount", "Date", "Description", "Tags", "Type"],
      "transactions"
    );
  }, [transactions]);

  const handleCsvImportClick = useCallback(() => {
    setIsCsvImportDialogOpen(true);
  }, []);

  // Group filter props using hook
  const filterProps = useTransactionFilterProps(
    filterState,
    form,
    {
      setDateFilter,
      setPriceFilter,
      setSearchQuery,
      setTagFilter,
      setTransactionTypeFilter,
      setPaymentMethodFilter,
      setCurrencyFilter,
      clearAllFilters,
    },
    orderedTags,
    {
      filterSheetOpen: isFilterSheetOpen,
      onFilterSheetOpenChange: setIsFilterSheetOpen,
    },
    hasActiveFilters
  );

  // Group action handlers
  const actions = useMemo(
    () => ({
      onCreateTransaction: handleCreateTransaction,
      onCsvImportClick: handleCsvImportClick,
      onCsvExportClick: handleCsvExport,
    }),
    [handleCreateTransaction, handleCsvImportClick, handleCsvExport]
  );

  return (
    <>
      {/* Sentinel element - used to detect when header should become sticky */}
      <div
        ref={expandedHeaderRef}
        className="h-0"
      />

      <TransactionOverviewHeader
        filterProps={filterProps}
        actions={actions}
        isSticky={isSticky}
        filterCount={filterCount}
        onFiltersClick={handleStickyFiltersClick}
      />

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
