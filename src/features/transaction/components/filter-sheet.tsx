"use client";

import type { ITag } from "@/features/shared/validation/schemas";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
import type { IButtonProps } from "@/features/ui/button/button";
import type { IDateFilter } from "@/features/ui/datepicker/datepicker";
import { Datepicker } from "@/features/ui/datepicker/datepicker";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Form } from "@/features/ui/form/form";
import type { IPriceRange } from "@/features/ui/input/range-input";
import { RangeInput } from "@/features/ui/input/range-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import type { UseFormReturn } from "react-hook-form";

export interface IFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<IFilterFormValues>;
  dateFilter: IDateFilter;
  onDateFilterChange: (filter: IDateFilter) => void;
  priceFilter: IPriceRange;
  onPriceFilterChange: (filter: IPriceRange) => void;
  tags: ITag[];
  onClearAll: () => void;
  onApply: () => void;
}

export function FilterSheet({
  open,
  onOpenChange,
  form,
  dateFilter,
  onDateFilterChange,
  priceFilter,
  onPriceFilterChange,
  tags,
  onClearAll,
  onApply,
}: IFilterSheetProps) {
  const tagOptions = tags.map((tag) => ({
    value: tag.id,
    label: tag.name,
    data: tag,
  }));

  const footerButtons: IButtonProps[] = [
    {
      clicked: onClearAll,
      variant: "default",
      size: "md",
      buttonContent: "Clear all",
    },
    {
      clicked: () => {
        onApply();
        onOpenChange(false);
      },
      variant: "primary",
      size: "md",
      buttonContent: "Apply",
    },
  ];

  return (
    <BottomSheet
      title="Filters"
      open={open}
      onOpenChange={onOpenChange}
      footerButtons={footerButtons}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Date Range
          </label>
          <Datepicker
            value={dateFilter}
            onChange={onDateFilterChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Amount Range
          </label>
          <RangeInput
            value={priceFilter}
            onChange={onPriceFilterChange}
          />
        </div>

        <Form
          form={form}
          onSubmit={() => {}}>
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
        </Form>
      </div>
    </BottomSheet>
  );
}
