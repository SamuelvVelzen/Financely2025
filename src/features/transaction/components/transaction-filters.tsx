import type { ITag } from "@/features/shared/validation/schemas";
import { FilterBar } from "@/features/transaction/components/filter-bar";
import { FilterSheet } from "@/features/transaction/components/filter-sheet";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
import { Button } from "@/features/ui/button/button";
import {
  Datepicker,
  type IDateFilter,
} from "@/features/ui/datepicker/datepicker";
import { Form } from "@/features/ui/form/form";
import type { IPriceRange } from "@/features/ui/input/range-input";
import { SearchInput } from "@/features/ui/input/search-input";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

export interface ITransactionFiltersProps {
  form: UseFormReturn<IFilterFormValues>;
  dateFilter: IDateFilter;
  onDateFilterChange: (filter: IDateFilter) => void;
  priceFilter: IPriceRange;
  onPriceFilterChange: (filter: IPriceRange) => void;
  tags: ITag[];
  onClearAll: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function TransactionFilters({
  form,
  dateFilter,
  onDateFilterChange,
  priceFilter,
  onPriceFilterChange,
  tags,
  onClearAll,
  hasActiveFilters,
  className,
}: ITransactionFiltersProps) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

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
        />
      </div>

      {/* Mobile: Search + Date inline */}
      <div className="md:hidden flex gap-3 items-end">
        <Form
          form={form}
          onSubmit={() => {}}>
          <div className="flex gap-3 items-end w-full">
            <div className="flex-1">
              <SearchInput name="searchQuery" />
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
      />
    </>
  );
}
