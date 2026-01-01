"use client";

import type { ITag } from "@/features/shared/validation/schemas";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
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
}: IFilterBarProps) {
  const { isMobile } = useResponsive();

  const tagOptions = tags.map((tag) => ({
    value: tag.id,
    label: tag.name,
    data: tag,
  }));

  // On desktop, show primary filters inline and secondary in popover
  // On mobile, this component is not used (FilterSheet is used instead)
  if (isMobile) {
    return null;
  }

  const tagFilter = form.watch("tagFilter") ?? [];
  const hasSecondaryFilters =
    priceFilter.min !== undefined ||
    priceFilter.max !== undefined ||
    tagFilter.length > 0;

  return (
    <div
      className={cn(
        "flex gap-3 items-end pb-4 pt-2 px-2 overflow-x-auto",
        className
      )}>
      <Form
        form={form}
        onSubmit={() => {}}>
        <div className="flex gap-3 items-end">
          {/* Primary filters - always visible */}
          <SearchInput name="searchQuery" />
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
                      {tagFilter.length +
                        (priceFilter.min !== undefined ||
                        priceFilter.max !== undefined
                          ? 1
                          : 0)}
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
                  Amount Range
                </label>
                <RangeInput
                  value={priceFilter}
                  onChange={onPriceFilterChange}
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
                  children={(option) => (
                    <>
                      {option.data?.color && (
                        <div
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: option.data.color }}
                        />
                      )}
                      <span>{option.label}</span>
                    </>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  clicked={onClearAll}
                  variant="default"
                  size="sm"
                  buttonContent="Clear all"
                  className="flex-1"
                />
              </div>
            </div>
          </Dropdown>
        </div>
      </Form>
    </div>
  );
}
