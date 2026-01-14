import type { ITag } from "@/features/shared/validation/schemas";
import { getCurrencyOptions } from "@/features/shared/validation/schemas";
import { PAYMENT_METHOD_OPTIONS } from "@/features/transaction/config/payment-methods";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
import { calculateFilterCount } from "@/features/transaction/utils/filter-count";
import { Button } from "@/features/ui/button/button";
import {
  Datepicker,
  type IDateFilter,
} from "@/features/ui/datepicker/datepicker";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { Form } from "@/features/ui/form/form";
import { RangeInput, type IPriceRange } from "@/features/ui/input/range-input";
import { SearchInput } from "@/features/ui/input/search-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { cn } from "@/features/util/cn";
import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { HiFunnel } from "react-icons/hi2";
import { useResponsive } from "../../shared/hooks/useResponsive";

export interface IFilterBarProps {
  form: UseFormReturn<IFilterFormValues>;
  dateFilter: IDateFilter;
  onDateFilterChange: (filter: IDateFilter) => void;
  priceFilter: IPriceRange;
  onPriceFilterChange: (filter: IPriceRange) => void;
  tags: ITag[];
  onClearAll: () => void;
  className?: string;
  filterState?: {
    tagFilter: string[];
    transactionTypeFilter: string[];
    paymentMethodFilter: string[];
    currencyFilter: string[];
    priceFilter: IPriceRange;
  };
  setSearchQuery?: (query: string) => void;
  setTagFilter?: (tags: string[]) => void;
  setTransactionTypeFilter?: (types: string[]) => void;
  setPaymentMethodFilter?: (methods: string[]) => void;
  setCurrencyFilter?: (currencies: string[]) => void;
}

export function FilterBar({
  form,
  dateFilter,
  onDateFilterChange,
  priceFilter,
  onPriceFilterChange,
  tags,
  onClearAll,
  className,
  filterState: externalFilterState,
  setSearchQuery,
  setTagFilter,
  setTransactionTypeFilter,
  setPaymentMethodFilter,
  setCurrencyFilter,
}: IFilterBarProps) {
  const { isMobile } = useResponsive();

  // All hooks must be called before any conditional returns
  const tagFilter = form.watch("tagFilter") ?? [];
  const transactionTypeFilter = form.watch("transactionTypeFilter") ?? [];
  const paymentMethodFilter = form.watch("paymentMethodFilter") ?? [];
  const currencyFilter = form.watch("currencyFilter") ?? [];

  const tagOptions = tags.map((tag) => ({
    value: tag.id,
    label: tag.name,
    data: tag,
  }));

  // Use external filter state if provided, otherwise use form values
  const effectiveFilterState = externalFilterState ?? {
    tagFilter,
    transactionTypeFilter,
    paymentMethodFilter,
    currencyFilter,
    priceFilter,
  };

  const hasSecondaryFilters = useMemo(() => {
    const hasTransactionTypeFilter =
      effectiveFilterState.transactionTypeFilter.length > 0 &&
      effectiveFilterState.transactionTypeFilter.length < 2;
    return (
      effectiveFilterState.priceFilter.min !== undefined ||
      effectiveFilterState.priceFilter.max !== undefined ||
      effectiveFilterState.tagFilter.length > 0 ||
      hasTransactionTypeFilter ||
      effectiveFilterState.paymentMethodFilter.length > 0 ||
      effectiveFilterState.currencyFilter.length > 0
    );
  }, [effectiveFilterState]);

  const filterCount = useMemo(() => {
    return calculateFilterCount({
      priceFilter: effectiveFilterState.priceFilter,
      tagFilter: effectiveFilterState.tagFilter,
      transactionTypeFilter: effectiveFilterState.transactionTypeFilter,
      paymentMethodFilter: effectiveFilterState.paymentMethodFilter,
      currencyFilter: effectiveFilterState.currencyFilter,
      dateFilter: { type: "allTime" },
      searchQuery: "",
    });
  }, [effectiveFilterState]);

  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const paymentMethodOptions = useMemo(() => PAYMENT_METHOD_OPTIONS, []);
  const transactionTypeOptions = useMemo(
    () => [
      { value: "EXPENSE", label: "Expense" },
      { value: "INCOME", label: "Income" },
    ],
    []
  );

  // On desktop, show primary filters inline and secondary in popover
  // On mobile, this component is not used (FilterSheet is used instead)
  if (isMobile) {
    return null;
  }

  return (
    <div className={cn("flex gap-3 items-end", className)}>
      <Form
        form={form}
        onSubmit={() => {}}>
        <div className="flex gap-3 items-end">
          {/* Primary filters - always visible */}
          <SearchInput
            name="searchQuery"
            onValueChange={(value) => {
              const formValue = (value as string) ?? "";
              setSearchQuery?.(formValue);
            }}
          />
          <Datepicker
            value={dateFilter}
            onChange={onDateFilterChange}
          />

          {/* Secondary filters - in popover */}
          <Dropdown
            dropdownSelector={{
              content: (
                <div className="flex items-center gap-2">
                  <HiFunnel className="size-4" />
                  <span>Filters</span>
                  {hasSecondaryFilters && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                      {filterCount}
                    </span>
                  )}
                </div>
              ),
              variant: hasSecondaryFilters ? "primary" : "default",
            }}
            placement="bottom"
            closeOnItemClick={false}>
            <div className="p-4 space-y-4 min-w-[300px]">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Transaction Type
                </label>
                <SelectDropdown
                  name="transactionTypeFilter"
                  options={transactionTypeOptions}
                  multiple
                  placeholder="Filter by transaction type"
                  onValueChange={(value) => {
                    const formValue = (Array.isArray(value) ? value : []).filter(
                      (v): v is string => v !== undefined
                    );
                    setTransactionTypeFilter?.(formValue);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Amount Range
                </label>
                <RangeInput
                label="Amount Range"
                  value={priceFilter}
                  onChange={onPriceFilterChange}
                  className="w-100"
                />

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Payment Method
                </label>
                <SelectDropdown
                  name="paymentMethodFilter"
                  options={paymentMethodOptions}
                  multiple
                  placeholder="Filter by payment method"
                  onValueChange={(value) => {
                    const formValue = (Array.isArray(value) ? value : []).filter(
                      (v): v is string => v !== undefined
                    );
                    setPaymentMethodFilter?.(formValue);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Currency
                </label>
                <SelectDropdown
                  name="currencyFilter"
                  options={currencyOptions}
                  multiple
                  placeholder="Filter by currency"
                  onValueChange={(value) => {
                    const formValue = (Array.isArray(value) ? value : []).filter(
                      (v): v is string => v !== undefined
                    );
                    setCurrencyFilter?.(formValue);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Tags
                </label>
                <SelectDropdown
                  name="tagFilter"
                  options={tagOptions}
                  multiple
                  placeholder="Filter by tags"
                  onValueChange={(value) => {
                    const formValue = (Array.isArray(value) ? value : []).filter(
                      (v): v is string => v !== undefined
                    );
                    setTagFilter?.(formValue);
                  }}>
                  {(option) => (
                    <>
                      {option.data?.emoticon && (
                        <span className="text-base shrink-0">
                          {option.data.emoticon}
                        </span>
                      )}
                      {option.data?.color && (
                        <div
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: option.data.color }}
                        />
                      )}
                      <span>{option.label}</span>
                    </>
                  )}
                </SelectDropdown>
              </div>
            </div>

            <Dropdown.Footer className="p-4">
              <Button
                clicked={onClearAll}
                variant="primary"
                size="sm"
                buttonContent="Clear all"
                className="flex-1"
              />
            </Dropdown.Footer>
          </Dropdown>
        </div>
      </Form>
    </div>
  );
}
