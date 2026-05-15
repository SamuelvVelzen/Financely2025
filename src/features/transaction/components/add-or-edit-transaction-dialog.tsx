import { Currency } from "@/features/currency/components/currency";
import { CurrencySelect } from "@/features/currency/components/currency-select";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  CreateTransactionInputSchema,
  CurrencySchema,
  type ITransaction,
  TransactionTypeSchema,
} from "@/features/shared/validation/schemas";
import type { ISubscriptionFrequency } from "@/features/subscription/config/frequencies";
import { FREQUENCY_LABELS } from "@/features/subscription/config/frequencies";
import { useSubscription } from "@/features/subscription/hooks/useSubscriptions";
import { PAYMENT_METHOD_OPTIONS } from "@/features/transaction/config/payment-methods";
import {
  useCreateExpense,
  useCreateIncome,
  useUpdateExpense,
  useUpdateIncome,
} from "@/features/transaction/hooks/useTransactions";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { DateInput } from "@/features/ui/input/date-input";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { TextInput } from "@/features/ui/input/text-input";
import { Textarea } from "@/features/ui/input/textarea";
import { RadioGroup } from "@/features/ui/radio/radio-group";
import { RadioItem } from "@/features/ui/radio/radio-item";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { TagSelect } from "@/features/ui/tag-select/tag-select";
import { useToast } from "@/features/ui/toast";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import {
  dateOnlyToIso,
  isoToDateOnly,
} from "@/features/util/date/dateisohelpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseISO } from "date-fns";
import { useCallback, useEffect, useId, useState } from "react";
import { type Resolver } from "react-hook-form";
import { HiArrowPath, HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { z } from "zod";

type IAddOrEditTransactionDialog = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: ITransaction;
  onSuccess?: () => void;
};

// Form schema that matches CreateTransactionInputSchema but with localized string amount for the form
const TransactionFormSchema = CreateTransactionInputSchema.omit({
  type: true,
  amount: true,
  transactionDate: true,
}).extend({
  type: TransactionTypeSchema,
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0;
    }, "Amount must be positive"),
  transactionDate: z.string().min(1, "Date is required"),
  tagIds: z.array(z.string()).optional().default([]),
  primaryTagId: z.string().nullable().optional(),
});

type FormData = z.infer<typeof TransactionFormSchema>;
const getEmptyFormValues = (): FormData => {
  // Default to today's date as date-only ISO
  const now = new Date();
  const dateOnly = isoToDateOnly(now.toISOString());
  const dateOnlyIso = dateOnlyToIso(dateOnly);

  return {
    name: "",
    amount: "",
    currency: "EUR",
    type: "EXPENSE",
    transactionDate: dateOnlyIso,
    paymentMethod: "OTHER",
    description: "",
    tagIds: [],
    primaryTagId: null,
  };
};

export function AddOrEditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: IAddOrEditTransactionDialog) {
  const [pendingAction, setPendingAction] = useState<
    null | "close" | "addAnother"
  >(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hasTime, setHasTime] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const pending = pendingAction !== null;
  const isEditMode = !!transaction;
  const { mutate: createExpense } = useCreateExpense();
  const { mutate: createIncome } = useCreateIncome();
  const { mutate: updateExpense } = useUpdateExpense();
  const { mutate: updateIncome } = useUpdateIncome();
  const toast = useToast();

  const formId = useId();
  const form = useFinForm<FormData>({
    resolver: zodResolver(TransactionFormSchema) as Resolver<FormData>,
    defaultValues: getEmptyFormValues(),
  });
  const hasUnsavedChanges = form.formState.isDirty;
  const transactionType = form.watch("type");

  const focusFirstInput = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void form.setFocus("name");
      });
    });
  }, [form]);

  const resetFormToClosedState = () => {
    form.reset(getEmptyFormValues());
    setDatePickerOpen(false);
    setShowAdvanced(false);
  };

  const resetFormForAnotherTransaction = () => {
    form.reset(getEmptyFormValues());
    setHasTime(false);
    setDatePickerOpen(false);
    setShowAdvanced(false);
  };

  const closeDialog = () => {
    resetFormToClosedState();
    onOpenChange(false);
  };

  const handleAttemptClose = () => {
    if (pending) return;
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    closeDialog();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    handleAttemptClose();
  };

  // Reset form when dialog opens/closes or transaction changes
  useEffect(() => {
    if (open) {
      if (transaction) {
        // Edit mode: populate form with existing transaction data
        const isDateTime = transaction.timePrecision === "DateTime";
        setHasTime(isDateTime);
        setShowAdvanced(false);

        // DateInput expects ISO strings
        form.reset({
          name: transaction.name,
          amount: transaction.amount,
          currency: transaction.currency,
          type: transaction.type,
          transactionDate: transaction.transactionDate, // Already ISO string
          paymentMethod: transaction.paymentMethod,
          description: transaction.description ?? "",
          tagIds: transaction.tags.map((tag) => tag.id),
          primaryTagId: transaction.primaryTag?.id ?? null,
        });
      } else {
        // Create mode: reset to defaults with current date (no time - DateOnly default)
        const now = new Date();
        setHasTime(false);
        setShowAdvanced(false);
        // Convert to ISO with noon UTC for date-only
        const dateOnly = isoToDateOnly(now.toISOString());
        const dateOnlyIso = dateOnlyToIso(dateOnly);
        form.reset({
          name: "",
          amount: "",
          currency: "EUR",
          type: "EXPENSE",
          transactionDate: dateOnlyIso,
          paymentMethod: "OTHER",
          description: "",
          tagIds: [],
          primaryTagId: null,
        });
      }
      focusFirstInput();
    } else {
      // Reset form when dialog closes to ensure clean state
      setHasTime(false);
      setDatePickerOpen(false);
      setShowAdvanced(false);
      form.reset(getEmptyFormValues());
    }
  }, [open, transaction?.id, form, focusFirstInput]);

  const handleToggleTime = () => {
    const currentValue = form.getValues("transactionDate");
    if (!currentValue) return;

    try {
      const currentDate = parseISO(currentValue);

      if (hasTime) {
        // Removing time: convert to date-only ISO (noon UTC)
        const dateOnly = isoToDateOnly(currentValue);
        const dateOnlyIso = dateOnlyToIso(dateOnly);
        form.setValue("transactionDate", dateOnlyIso, { shouldDirty: true });
        setHasTime(false);
      } else {
        // Adding time: preserve date, use current time
        const updatedDate = new Date(currentDate);
        const now = new Date();
        updatedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
        form.setValue("transactionDate", updatedDate.toISOString(), {
          shouldDirty: true,
        });
        setHasTime(true);
        // Open the datepicker when adding time
        setDatePickerOpen(true);
      }
    } catch (error) {
      // If parsing fails, don't toggle
      console.error("Failed to parse date:", error);
    }
  };

  const processFormSubmit = async (
    data: FormData,
    afterSuccess: "close" | "addAnother",
  ) => {
    const resolvedAfterSuccess = isEditMode ? "close" : afterSuccess;
    setPendingAction(resolvedAfterSuccess);

    // DateInput already provides ISO strings, we just need to determine precision
    const transactionDateIso = data.transactionDate;
    const timePrecision: "DateTime" | "DateOnly" = hasTime
      ? "DateTime"
      : "DateOnly";

    const submitData = {
      name: data.name.trim(),
      amount: data.amount.trim(),
      currency: CurrencySchema.parse(data.currency),
      transactionDate: transactionDateIso,
      timePrecision,
      paymentMethod: data.paymentMethod,
      description:
        data.description && data.description.trim() !== ""
          ? data.description.trim()
          : null,
      tagIds: data.tagIds || [],
      primaryTagId: data.primaryTagId || null,
    };

    try {
      if (isEditMode && transaction) {
        // Update existing transaction - use appropriate hook based on type
        if (data.type === "EXPENSE") {
          updateExpense(
            { transactionId: transaction.id, input: submitData },
            {
              onSuccess: (data) => {
                resetFormToClosedState();
                setPendingAction(null);
                onOpenChange(false);
                if (!isOfflineMutationPlaceholder(data)) {
                  toast.success("Expense updated successfully");
                }
                onSuccess?.();
              },
              onError: (error) => {
                setPendingAction(null);
                toast.error("Failed to update expense");
                throw error;
              },
            }
          );
        } else {
          updateIncome(
            { transactionId: transaction.id, input: submitData },
            {
              onSuccess: (data) => {
                resetFormToClosedState();
                setPendingAction(null);
                onOpenChange(false);
                if (!isOfflineMutationPlaceholder(data)) {
                  toast.success("Income updated successfully");
                }
                onSuccess?.();
              },
              onError: (error) => {
                setPendingAction(null);
                toast.error("Failed to update income");
                throw error;
              },
            }
          );
        }
      } else {
        // Create new transaction - use appropriate hook based on type
        if (data.type === "EXPENSE") {
          createExpense(submitData, {
            onSuccess: (data) => {
              if (resolvedAfterSuccess === "addAnother") {
                resetFormForAnotherTransaction();
                setPendingAction(null);
                if (!isOfflineMutationPlaceholder(data)) {
                  toast.success("Expense created successfully");
                }
                onSuccess?.();
                focusFirstInput();
              } else {
                resetFormToClosedState();
                onOpenChange(false);
                setPendingAction(null);
                if (!isOfflineMutationPlaceholder(data)) {
                  toast.success("Expense created successfully");
                }
                onSuccess?.();
              }
            },
            onError: (error) => {
              setPendingAction(null);
              toast.error("Failed to create expense");
              throw error;
            },
          });
        } else {
          createIncome(submitData, {
            onSuccess: (data) => {
              if (resolvedAfterSuccess === "addAnother") {
                resetFormForAnotherTransaction();
                setPendingAction(null);
                if (!isOfflineMutationPlaceholder(data)) {
                  toast.success("Income created successfully");
                }
                onSuccess?.();
                focusFirstInput();
              } else {
                resetFormToClosedState();
                onOpenChange(false);
                setPendingAction(null);
                if (!isOfflineMutationPlaceholder(data)) {
                  toast.success("Income created successfully");
                }
                onSuccess?.();
              }
            },
            onError: (error) => {
              setPendingAction(null);
              toast.error("Failed to create income");
              throw error;
            },
          });
        }
      }
    } catch (err) {
      setPendingAction(null);
      throw err; // Let Form component handle the error
    }
  };

  const dialogTitle = isEditMode
    ? `Edit ${transactionType === "EXPENSE" ? "Expense" : "Income"}`
    : "Create Transaction";

  return (
    <>
      <Dialog
        title={dialogTitle}
        content={
          <Form<FormData>
            form={form}
            onSubmit={(data) => processFormSubmit(data, "close")}
            id={formId}>
            <div className="space-y-4">
              {/* Transaction type selector - only show in create mode */}
              {!isEditMode && (
                <RadioGroup
                  name="type"
                  label="Type"
                  required
                  disabled={pending}
                  orientation="horizontal">
                  <RadioItem value="EXPENSE">Expense</RadioItem>
                  <RadioItem value="INCOME">Income</RadioItem>
                </RadioGroup>
              )}
              <TextInput
                name="name"
                label="Name"
                disabled={pending}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <DecimalInput
                  name="amount"
                  label="Amount"
                  disabled={pending}
                  required
                />
                <CurrencySelect
                  name="currency"
                  label="Currency"
                  disabled={pending}
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <DateInput
                    name="transactionDate"
                    label={hasTime ? "Date & Time" : "Date"}
                    mode={hasTime ? "dateTime" : "dateOnly"}
                    disabled={pending}
                    required
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                    onAddTime={handleToggleTime}
                    onRemoveTime={handleToggleTime}
                  />
                </div>
                <Button
                  clicked={handleToggleTime}
                  disabled={pending}
                  className="whitespace-nowrap min-w-50">
                  {hasTime ? "Remove time" : "Add time"}
                </Button>
              </div>

              <button
                type="button"
                className="flex items-center gap-1 text-sm text-info hover:underline disabled:opacity-50 disabled:pointer-events-none"
                disabled={pending}
                onClick={() => setShowAdvanced((v) => !v)}>
                {showAdvanced ? (
                  <HiChevronUp className="size-4 shrink-0" />
                ) : (
                  <HiChevronDown className="size-4 shrink-0" />
                )}
                {showAdvanced ? "Hide advanced options" : "Show advanced options"}
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-1">
                  <SelectDropdown
                    name="paymentMethod"
                    label="Payment Method"
                    options={PAYMENT_METHOD_OPTIONS}
                    placeholder="Select payment method..."
                    disabled={pending}
                  />
                  <Textarea
                    name="description"
                    label="Description"
                    disabled={pending}
                    rows={3}
                    placeholder="Add details..."
                  />
                  <TagSelect
                    name="primaryTagId"
                    label="Primary Tag"
                    multiple={false}
                    placeholder="Select primary tag..."
                    disabled={pending}
                    transactionType={transactionType}
                    hint="Used for budget, sorting and display"
                  />
                  <TagSelect
                    name="tagIds"
                    label="Tags"
                    multiple={true}
                    placeholder="Select tags..."
                    disabled={pending}
                    transactionType={transactionType}
                  />
                </div>
              )}

              {isEditMode && transaction?.subscription && (
                <SubscriptionInfo
                  subscriptionId={transaction.subscription.id}
                  subscriptionName={transaction.subscription.name}
                  frequency={transaction.subscription.frequency}
                  active={transaction.subscription.active}
                  currentTransactionId={transaction.id}
                />
              )}
            </div>
          </Form>
        }
        footerButtons={[
          {
            clicked: handleAttemptClose,
            disabled: pending,
            buttonContent: "Cancel",
          },
          ...(!isEditMode
            ? [
              {
                clicked: () => {
                  void form.handleSubmit((data) =>
                    processFormSubmit(data, "addAnother"),
                  )();
                },
                disabled: pending,
                loading: {
                  isLoading: pendingAction === "addAnother",
                  text: `Creating ${transactionType === "EXPENSE" ? "expense" : "income"}`,
                },
                buttonContent: "Create & add another",
              } as const,
            ]
            : []),
          {
            variant: "primary" as const,
            type: "submit" as const,
            form: formId,
            loading: {
              isLoading: pendingAction === "close",
              text: isEditMode
                ? `Updating ${transactionType === "EXPENSE" ? "expense" : "income"}`
                : `Creating ${transactionType === "EXPENSE" ? "expense" : "income"}`,
            },
            buttonContent: isEditMode ? "Update" : "Create",
          },
        ]}
        open={open}
        onOpenChange={handleDialogOpenChange}
        dismissible={!pending}
        variant="modal"
        size="xl"
      />

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={() => {
          setShowUnsavedDialog(false);
          closeDialog();
        }}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}

type ISubscriptionInfoProps = {
  subscriptionId: string;
  subscriptionName: string;
  frequency: string;
  active: boolean;
  currentTransactionId: string;
};

function SubscriptionInfo({
  subscriptionId,
  subscriptionName,
  frequency,
  active,
  currentTransactionId,
}: ISubscriptionInfoProps) {
  const [showTransactions, setShowTransactions] = useState(false);
  const { data: subscription } = useSubscription(subscriptionId);
  const transactions = subscription?.transactions ?? [];
  const otherTransactions = transactions.filter(
    (t) => t.id !== currentTransactionId,
  );

  return (
    <div className="border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiArrowPath className="size-4 text-info" />
          <span className="text-sm font-medium text-text">
            {subscriptionName}
          </span>
          <Badge variant="info" className="text-xs">
            {FREQUENCY_LABELS[frequency as ISubscriptionFrequency] ??
              frequency}
          </Badge>
          {!active && (
            <Badge variant="warning" className="text-xs">
              Paused
            </Badge>
          )}
        </div>
      </div>

      {otherTransactions.length > 0 && (
        <>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
            onClick={() => setShowTransactions(!showTransactions)}>
            {showTransactions ? (
              <HiChevronUp className="size-3" />
            ) : (
              <HiChevronDown className="size-3" />
            )}
            {otherTransactions.length} other transaction
            {otherTransactions.length !== 1 ? "s" : ""}
          </button>

          {showTransactions && (
            <div className="space-y-1 ml-2">
              {otherTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-xs text-text-muted py-0.5">
                  <span className="truncate flex-1">{tx.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span>
                      {DateFormatHelpers.formatIsoStringToString(
                        tx.transactionDate,
                        "DateOnly",
                      )}
                    </span>
                    <Currency
                      amount={tx.amount}
                      type={tx.type}
                      currency={tx.currency}
                      className="text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
