import type { ITag } from "@/features/shared/validation/schemas";
import { ActiveFiltersRow } from "@/features/transaction/components/active-filters-row";
import { FilterBar } from "@/features/transaction/components/filter-bar";
import { FilterSheet } from "@/features/transaction/components/filter-sheet";
import type { ITransactionViewControlsProps } from "@/features/transaction/components/transaction-view-controls";
import { useTransactionFilterBadges } from "@/features/transaction/hooks/use-transaction-filter-badges";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
import type { ITransactionFilterState } from "@/features/transaction/utils/transaction-filter-model";
import { Button } from "@/features/ui/button/button";
import { type IDateFilter } from "@/features/ui/datepicker/datepicker";
import { Form } from "@/features/ui/form/form";
import type { IPriceRange } from "@/features/ui/input/range-input";
import { SearchInput } from "@/features/ui/input/search-input";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { HiFunnel } from "react-icons/hi2";
import { calculateFilterCount } from "../utils/filter-count";

export interface ITransactionFiltersProps {
  form: UseFormReturn<IFilterFormValues>;
  filterState: ITransactionFilterState;
  dateFilter: IDateFilter;
  onDateFilterChange: (filter: IDateFilter) => void;
  priceFilter: IPriceRange;
  onPriceFilterChange: (filter: IPriceRange) => void;
  tags: ITag[];
  onClearAll: () => void;
  hasActiveFilters: boolean;
  setSearchQuery: (query: string) => void;
  setTagFilter: (tags: string[]) => void;
  setTransactionTypeFilter?: (types: string[]) => void;
  setPaymentMethodFilter?: (methods: string[]) => void;
  setCurrencyFilter?: (currencies: string[]) => void;
  className?: string;
  filterSheetOpen?: boolean;
  onFilterSheetOpenChange?: (open: boolean) => void;
  viewMode?: ITransactionViewControlsProps;
  hideActiveBadges?: boolean;
}

export function TransactionFilters({
  form,
  filterState,
  dateFilter,
  onDateFilterChange,
  priceFilter,
  onPriceFilterChange,
  tags,
  onClearAll,
  hasActiveFilters,
  setSearchQuery,
  setTagFilter,
  setTransactionTypeFilter,
  setPaymentMethodFilter,
  setCurrencyFilter,
  className,
  filterSheetOpen: externalFilterSheetOpen,
  onFilterSheetOpenChange: externalOnFilterSheetOpenChange,
  viewMode,
  hideActiveBadges = false,
}: ITransactionFiltersProps) {
  const [internalFilterSheetOpen, setInternalFilterSheetOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isFilterSheetOpen = externalFilterSheetOpen ?? internalFilterSheetOpen;
  const setIsFilterSheetOpen =
    externalOnFilterSheetOpenChange ?? setInternalFilterSheetOpen;

  const badges = useTransactionFilterBadges({
    filterState,
    tags,
    onDateFilterChange,
    onPriceFilterChange,
    setSearchQuery,
    setTagFilter,
    setTransactionTypeFilter,
    setPaymentMethodFilter,
    setCurrencyFilter,
  });

  const mobileFilterCount = useMemo(
    () => calculateFilterCount(filterState),
    [filterState]
  );

  return (
    <>
      {/* Desktop: FilterBar */}
      <div className="hidden min-w-0 md:block">
        <FilterBar
          form={form}
          dateFilter={dateFilter}
          onDateFilterChange={onDateFilterChange}
          priceFilter={priceFilter}
          onPriceFilterChange={onPriceFilterChange}
          tags={tags}
          onClearAll={onClearAll}
          className={className}
          filterState={{
            tagFilter: filterState.tagFilter,
            transactionTypeFilter: filterState.transactionTypeFilter,
            paymentMethodFilter: filterState.paymentMethodFilter,
            currencyFilter: filterState.currencyFilter,
            priceFilter: filterState.priceFilter,
          }}
          setSearchQuery={setSearchQuery}
          setTagFilter={setTagFilter}
          setTransactionTypeFilter={setTransactionTypeFilter}
          setPaymentMethodFilter={setPaymentMethodFilter}
          setCurrencyFilter={setCurrencyFilter}
          viewMode={viewMode}
        />
        {!hideActiveBadges && (
          <ActiveFiltersRow
            badges={badges}
            onClearAll={onClearAll}
          />
        )}
      </div>

      {/* Mobile: Search + filters */}
      <div className="flex min-w-0 flex-col gap-3 md:hidden">
        <Form
          form={form}
          onSubmit={() => { }}>
          <div className="flex gap-2 items-center w-full min-w-0">
            <SearchInput
              name="searchQuery"
              alwaysExpanded
              size="sm"
              placeholder="Search"
              className="flex-1 min-w-0"
              onValueChange={(value) => {
                const formValue = (value as string) ?? "";
                setSearchQuery(formValue);
              }}
            />
            <Button
              clicked={() => setIsFilterSheetOpen(true)}
              variant={hasActiveFilters ? "primary" : "default"}
              size="sm"
              className="shrink-0"
              buttonContent={
                <span className="flex items-center gap-1.5">
                  <HiFunnel className="size-4" />
                  <span>
                    Filters
                    {mobileFilterCount > 0 ? ` (${mobileFilterCount})` : ""}
                  </span>
                </span>
              }
            />
          </div>
        </Form>
        {!hideActiveBadges && (
          <ActiveFiltersRow
            badges={badges}
            onClearAll={onClearAll}
          />
        )}
      </div>

      {/* Mobile Filter Sheet */}
      <FilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        form={form}
        dateFilter={dateFilter}
        onDateFilterChange={onDateFilterChange}
        priceFilter={priceFilter}
        onPriceFilterChange={onPriceFilterChange}
        tags={tags}
        onClearAll={onClearAll}
        onApply={() => {
          // Filters are applied instantly, just close the sheet
        }}
        setTagFilter={setTagFilter}
        setTransactionTypeFilter={setTransactionTypeFilter}
        setPaymentMethodFilter={setPaymentMethodFilter}
        setCurrencyFilter={setCurrencyFilter}
        viewMode={viewMode}
      />
    </>
  );
}
