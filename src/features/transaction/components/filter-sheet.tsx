import type { ITag } from "@/features/shared/validation/schemas";
import { getCurrencyOptions } from "@/features/shared/validation/schemas";
import type { ITransactionViewControlsProps } from "@/features/transaction/components/transaction-view-controls";
import { TransactionViewControls } from "@/features/transaction/components/transaction-view-controls";
import { PAYMENT_METHOD_OPTIONS } from "@/features/transaction/config/payment-methods";
import type { IFilterFormValues } from "@/features/transaction/hooks/useTransactionFilters";
import type { IButtonProps } from "@/features/ui/button/button";
import { CheckboxGroup, CheckboxItem } from "@/features/ui/checkbox";
import type { IDateFilter } from "@/features/ui/datepicker/datepicker";
import { Datepicker } from "@/features/ui/datepicker/datepicker";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Form } from "@/features/ui/form/form";
import type { IPriceRange } from "@/features/ui/input/range-input";
import { RangeInput } from "@/features/ui/input/range-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Tab } from "@/features/ui/tab/tab";
import { TabContent } from "@/features/ui/tab/tab-content";
import { useTabContext } from "@/features/ui/tab/tab-context";
import { Tabs } from "@/features/ui/tab/tabs";
import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

function TabValueReporter({ onChange }: { onChange: (value: string) => void }) {
  const { value } = useTabContext();

  useEffect(() => {
    onChange(value);
  }, [value, onChange]);

  return null;
}

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
  setTagFilter?: (tags: string[]) => void;
  setTransactionTypeFilter?: (types: string[]) => void;
  setPaymentMethodFilter?: (methods: string[]) => void;
  setCurrencyFilter?: (currencies: string[]) => void;
  viewMode?: ITransactionViewControlsProps;
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
  setTagFilter,
  setTransactionTypeFilter,
  setPaymentMethodFilter,
  setCurrencyFilter,
  viewMode,
}: IFilterSheetProps) {
  const [tabState, setTabState] = useState({ trackedOpen: false, tab: "filters" });

  if (open !== tabState.trackedOpen) {
    setTabState({ trackedOpen: open, tab: open ? "filters" : tabState.tab });
  }

  const activeTab = tabState.tab;
  const setActiveTab = (tab: string) => {
    setTabState({ trackedOpen: open, tab });
  };

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

  const footerButtons: IButtonProps[] = useMemo(() => {
    if (viewMode && activeTab === "view") {
      return [
        {
          clicked: () => onOpenChange(false),
          variant: "primary",
          size: "md",
          buttonContent: "Done",
        },
      ];
    }

    return [
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
  }, [activeTab, onApply, onClearAll, onOpenChange, viewMode]);

  const filterForm = (
    <Form
      form={form}
      onSubmit={() => { }}>
      <div className="space-y-4">
        <CheckboxGroup
          name="transactionTypeFilter"
          label="Transaction Type"
          orientation="horizontal"
          onValueChange={(value) => {
            const formValue = (Array.isArray(value) ? value : []).filter(
              (v): v is string => v !== undefined
            );
            setTransactionTypeFilter?.(formValue);
          }}>
          {transactionTypeOptions.map((option) => (
            <CheckboxItem
              key={option.value}
              value={option.value}>
              {option.label}
            </CheckboxItem>
          ))}
        </CheckboxGroup>

        <div>
          <span className="block text-sm font-medium text-text mb-2">
            Date Range
          </span>
          <Datepicker
            value={dateFilter}
            onChange={onDateFilterChange}
          />
        </div>

        <RangeInput
          label="Amount Range"
          value={priceFilter}
          onChange={onPriceFilterChange}
        />

        <SelectDropdown
          name="paymentMethodFilter"
          label="Payment Method"
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

        <SelectDropdown
          name="currencyFilter"
          label="Currency"
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

        <SelectDropdown
          name="tagFilter"
          label="Tags"
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
                <span className="text-base shrink-0">{option.data.emoticon}</span>
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
  );

  return (
    <BottomSheet
      title="Filters"
      open={open}
      onOpenChange={onOpenChange}
      footerButtons={footerButtons}>
      {viewMode ? (
        <Tabs
          defaultValue="filters"
        >
          <TabValueReporter onChange={setActiveTab} />
          <Tab value="view">View settings</Tab>
          <Tab value="filters">Filters</Tab>

          <TabContent
            value="view"
            className="px-4">
            <TransactionViewControls
              {...viewMode}
              variant="sheet"
              size="md"
            />
          </TabContent>
          <TabContent
            value="filters"
            className="px-4">
            {filterForm}
          </TabContent>
        </Tabs>
      ) : (
        filterForm
      )}
    </BottomSheet>
  );
}
