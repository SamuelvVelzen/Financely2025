import type { ITag } from "@/features/shared/validation/schemas";
import { ActiveFiltersRow } from "@/features/transaction/components/active-filters-row";
import { FilterBar } from "@/features/transaction/components/filter-bar";
import { FilterSheet } from "@/features/transaction/components/filter-sheet";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
import { generateFilterBadges } from "@/features/transaction/utils/filter-badges";
import type { ITransactionFilterState } from "@/features/transaction/utils/transaction-filter-model";
import { DEFAULT_FILTER_STATE } from "@/features/transaction/utils/transaction-filter-model";
import { Button } from "@/features/ui/button/button";
import {
  Datepicker,
  type IDateFilter,
} from "@/features/ui/datepicker/datepicker";
import { Form } from "@/features/ui/form/form";
import type { IPriceRange } from "@/features/ui/input/range-input";
import { SearchInput } from "@/features/ui/input/search-input";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

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
}: ITransactionFiltersProps) {
  const [internalFilterSheetOpen, setInternalFilterSheetOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isFilterSheetOpen = externalFilterSheetOpen ?? internalFilterSheetOpen;
  const setIsFilterSheetOpen =
    externalOnFilterSheetOpenChange ?? setInternalFilterSheetOpen;

  // Generate badges for active filters
  const badges = useMemo(() => {
    return generateFilterBadges({
      filterState,
      tags,
      onRemoveDate: () => onDateFilterChange(DEFAULT_FILTER_STATE.dateFilter),
      onRemoveTag: (tagId) => {
        const currentTags = filterState.tagFilter;
        setTagFilter(currentTags.filter((id) => id !== tagId));
      },
      onRemoveAmount: () =>
        onPriceFilterChange(DEFAULT_FILTER_STATE.priceFilter),
      onRemoveSearch: () => setSearchQuery(""),
      onRemoveTransactionType: setTransactionTypeFilter
        ? () => setTransactionTypeFilter([])
        : undefined,
    });
  }, [
    filterState,
    tags,
    onDateFilterChange,
    onPriceFilterChange,
    setSearchQuery,
    setTagFilter,
    setTransactionTypeFilter,
  ]);

  return (
    <>
      {/* Desktop: FilterBar */}
      <div className="hidden md:block">
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
        />
        <ActiveFiltersRow
          badges={badges}
          onClearAll={onClearAll}
        />
      </div>

      {/* Mobile: Search + Date inline */}
      <div className="md:hidden flex flex-col gap-3">
        <Form
          form={form}
          onSubmit={() => {}}>
          <div className="flex gap-3 items-end w-full">
            <div className="flex-1">
              <SearchInput
                name="searchQuery"
                onValueChange={(value) => {
                  const formValue = (value as string) ?? "";
                  setSearchQuery(formValue);
                }}
              />
            </div>
            <Datepicker
              value={dateFilter}
              onChange={onDateFilterChange}
            />
            <Button
              clicked={() => setIsFilterSheetOpen(true)}
              variant={hasActiveFilters ? "primary" : "default"}
              size="sm"
              buttonContent="Filters"
            />
          </div>
        </Form>
        <ActiveFiltersRow
          badges={badges}
          onClearAll={onClearAll}
        />
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
      />
    </>
  );
}
