"use client";

import type { ITag } from "@/features/shared/validation/schemas";
import { getCurrencyOptions } from "@/features/shared/validation/schemas";
import { PAYMENT_METHOD_OPTIONS } from "@/features/transaction/config/payment-methods";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
import type { IButtonProps } from "@/features/ui/button/button";
import type { IDateFilter } from "@/features/ui/datepicker/datepicker";
import { Datepicker } from "@/features/ui/datepicker/datepicker";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Form } from "@/features/ui/form/form";
import type { IPriceRange } from "@/features/ui/input/range-input";
import { RangeInput } from "@/features/ui/input/range-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { useMemo } from "react";
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

  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const paymentMethodOptions = useMemo(() => PAYMENT_METHOD_OPTIONS, []);
  const transactionTypeOptions = useMemo(
    () => [
      { value: "EXPENSE", label: "Expense" },
      { value: "INCOME", label: "Income" },
    ],
    []
  );

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
        <Form
          form={form}
          onSubmit={() => {}}>
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Transaction Type
            </label>
            <SelectDropdown
              name="transactionTypeFilter"
              options={transactionTypeOptions}
              multiple
              placeholder="Filter by transaction type"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Payment Method
            </label>
            <SelectDropdown
              name="paymentMethodFilter"
              options={paymentMethodOptions}
              multiple
              placeholder="Filter by payment method"
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
              placeholder="Filter by tags">
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
        </Form>
      </div>
    </BottomSheet>
  );
}
