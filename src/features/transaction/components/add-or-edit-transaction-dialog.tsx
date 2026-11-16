import { CurrencySelect } from "@/features/currency/components/currency-select";
import { LedgerAccountSelect } from "@/features/ledger-account/components/ledger-account-select";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  CreateTransactionInputSchema,
  CurrencySchema,
  TransactionTypeSchema,
  TransferDirectionSchema,
  type ITagSuggestions,
  type ITransaction,
} from "@/features/shared/validation/schemas";
import { matchTagRules } from "@/features/tag-rule/api/client";
import { TagSuggestionHint } from "@/features/tag-rule/components/tag-suggestion-hint";
import { useTags } from "@/features/tag/hooks/useTags";
import { AllocateRefundDialog } from "@/features/transaction/components/allocate-refund-dialog";
import { PairTransferSection } from "@/features/transaction/components/pair-transfer-section";
import { SubscriptionInfo } from "@/features/transaction/components/subscription-info";
import { PAYMENT_METHOD_OPTIONS } from "@/features/transaction/config/payment-methods";
import {
  useCreateExpense,
  useCreateIncome,
  useCreateTransaction,
  useTransaction,
  useUpdateTransaction,
} from "@/features/transaction/hooks/useTransactions";
import { Button } from "@/features/ui/button/button";
import { ResponsiveDialog } from "@/features/ui/dialog/responsive-dialog";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { focusFirstInvalidField } from "@/features/ui/form/focus-first-invalid-field";
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
import {
  dateOnlyToIso,
  isoToDateOnly,
} from "@/features/util/date/dateisohelpers";
import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseISO } from "date-fns";
import { useCallback, useEffect, useId, useState } from "react";
import { type Resolver } from "react-hook-form";
import {
  HiArrowTrendingDown,
  HiArrowTrendingUp,
  HiArrowUturnLeft,
  HiArrowsRightLeft,
  HiChevronDown,
  HiChevronUp,
} from "react-icons/hi2";
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
  transferDirection: TransferDirectionSchema.nullable().optional(),
  ledgerAccountId: z.string().nullable().optional(),
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

function getTodayDateOnlyIso(): string {
  const now = new Date();
  const dateOnly = isoToDateOnly(now.toISOString());
  return dateOnlyToIso(dateOnly);
}

const getEmptyFormValues = (currency: string): FormData => ({
  name: "",
  amount: "",
  currency,
  type: "EXPENSE",
  transactionDate: getTodayDateOnlyIso(),
  paymentMethod: "OTHER",
  description: "",
  tagIds: [],
  primaryTagId: null,
  transferDirection: null,
  ledgerAccountId: null,
});

function getFormValuesForAnotherTransaction(
  submitted: FormData,
  defaultCurrency: string,
): FormData {
  return {
    ...getEmptyFormValues(defaultCurrency),
    type: submitted.type,
    currency: submitted.currency,
    paymentMethod: submitted.paymentMethod,
    transactionDate: submitted.transactionDate,
    primaryTagId: submitted.primaryTagId ?? null,
    tagIds: submitted.tagIds ?? [],
  };
}

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
  const dialogSessionKey = open ? (transaction?.id ?? "create") : "closed";
  const [uiSession, setUiSession] = useState({
    sessionKey: "closed" as string,
    hasTime: false,
    showAdvanced: false,
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tagSuggestion, setTagSuggestion] = useState<ITagSuggestions | null>(
    null,
  );
  const [userEditedTags, setUserEditedTags] = useState(false);
  const [isAllocateRefundOpen, setIsAllocateRefundOpen] = useState(false);
  const [workingTransaction, setWorkingTransaction] = useState<
    ITransaction | undefined
  >(transaction);
  const [expenseToOpenId, setExpenseToOpenId] = useState<string | null>(null);
  if (open && uiSession.sessionKey !== dialogSessionKey) {
    setUiSession({
      sessionKey: dialogSessionKey,
      hasTime: transaction?.timePrecision === "DateTime",
      showAdvanced: false,
    });
    setUserEditedTags(false);
    setTagSuggestion(null);
    setDatePickerOpen(false);
    setWorkingTransaction(transaction);
    setIsAllocateRefundOpen(false);
    setExpenseToOpenId(null);
  }
  if (!open && uiSession.sessionKey !== "closed") {
    setUiSession({ sessionKey: "closed", hasTime: false, showAdvanced: false });
    setTagSuggestion(null);
    setDatePickerOpen(false);
    setUserEditedTags(false);
    const preserveAllocateRefund = isAllocateRefundOpen;
    if (!preserveAllocateRefund) {
      setWorkingTransaction(undefined);
      setIsAllocateRefundOpen(false);
      setExpenseToOpenId(null);
    }
  }
  const hasTime = uiSession.hasTime;
  const showAdvanced = uiSession.showAdvanced;
  const setHasTime = (value: boolean) => {
    setUiSession((prev) => ({ ...prev, hasTime: value }));
  };
  const setShowAdvanced = (value: boolean) => {
    setUiSession((prev) => ({ ...prev, showAdvanced: value }));
  };
  const pending = pendingAction !== null;
  const isEditMode = !!workingTransaction;
  const { mutate: createExpense, mutateAsync: createExpenseAsync } =
    useCreateExpense();
  const { mutate: createIncome, mutateAsync: createIncomeAsync } =
    useCreateIncome();
  const { mutate: createTransaction } = useCreateTransaction();
  const { mutate: updateTransaction } = useUpdateTransaction();
  const linkedTransactionQuery = useTransaction(expenseToOpenId);
  const linkedTransaction = linkedTransactionQuery.data ?? undefined;
  const { data: tagsData } = useTags();
  const toast = useToast();
  const workspaceId = useNavWorkspaceId();
  const defaultCurrency = useDefaultCurrency(workspaceId);

  const formId = useId();
  const form = useFinForm<FormData>({
    resolver: zodResolver(TransactionFormSchema) as Resolver<FormData>,
    defaultValues: getEmptyFormValues(defaultCurrency),
  });
  const hasUnsavedChanges = form.formState.isDirty;
  const transactionType = form.watch("type");
  const watchedName = form.watch("name");
  const watchedDescription = form.watch("description");
  const watchedPaymentMethod = form.watch("paymentMethod");
  const watchedPrimaryTagId = form.watch("primaryTagId");
  const watchedCurrency = form.watch("currency");
  const debouncedName = useDebouncedValue(watchedName, 300);
  const watchedTagIds = form.watch("tagIds") ?? [];
  const additionalTagCount = watchedTagIds.length;
  const canFetchTagSuggestions =
    open &&
    !isEditMode &&
    !userEditedTags &&
    debouncedName.trim().length > 0 &&
    workspaceId != null &&
    !watchedPrimaryTagId &&
    watchedTagIds.length === 0;
  const displayTagSuggestion = canFetchTagSuggestions ? tagSuggestion : null;

  const focusFirstInput = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void form.setFocus("name");
      });
    });
  }, [form]);

  const resetFormToClosedState = () => {
    form.reset(getEmptyFormValues(defaultCurrency));
    setDatePickerOpen(false);
    setShowAdvanced(false);
    setTagSuggestion(null);
    setUserEditedTags(false);
  };

  const resetFormForAnotherTransaction = (submitted: FormData) => {
    const nextValues = getFormValuesForAnotherTransaction(
      submitted,
      defaultCurrency,
    );
    const preservedTags =
      (nextValues.tagIds?.length ?? 0) > 0 || !!nextValues.primaryTagId;

    form.reset(nextValues);
    setDatePickerOpen(false);
    setShowAdvanced((nextValues.tagIds?.length ?? 0) > 0);
    setTagSuggestion(null);
    setUserEditedTags(preservedTags);
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
    if (!open) {
      form.reset(getEmptyFormValues(defaultCurrency));
      return;
    }

    if (transaction) {
      // Edit mode: populate form with existing transaction data
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
      form.reset(getEmptyFormValues(defaultCurrency));
    }
    focusFirstInput();
  }, [
    open,
    transaction?.id,
    form,
    focusFirstInput,
    defaultCurrency,
    transaction,
  ]);

  useEffect(() => {
    if (!open || isEditMode || userEditedTags) {
      return;
    }

    const trimmedName = debouncedName.trim();
    if (!trimmedName || workspaceId == null) {
      return;
    }

    const primaryTagId = form.getValues("primaryTagId");
    const tagIds = form.getValues("tagIds") ?? [];
    if (primaryTagId || tagIds.length > 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await matchTagRules(workspaceId, {
          name: trimmedName,
          description: watchedDescription || null,
          paymentMethod: watchedPaymentMethod,
          type: transactionType,
        });

        if (cancelled) {
          return;
        }

        const { primaryTagId: suggestedPrimary, tagIds: suggestedTagIds } =
          result.suggestions;

        if (!suggestedPrimary && suggestedTagIds.length === 0) {
          setTagSuggestion(null);
          return;
        }

        const currentPrimary = form.getValues("primaryTagId");
        const currentTags = form.getValues("tagIds") ?? [];
        if (currentPrimary || currentTags.length > 0 || userEditedTags) {
          return;
        }

        const primaryMatch = result.matches.find(
          (match) =>
            match.tagId === suggestedPrimary &&
            (match.applyAs === "PRIMARY" || match.applyAs === "BOTH"),
        );

        const suggestion: ITagSuggestions = {
          primaryTagId: suggestedPrimary,
          tagIds: suggestedTagIds,
          suggested: true,
          primaryRule: primaryMatch
            ? {
                ruleId: primaryMatch.ruleId,
                ruleLabel: primaryMatch.ruleLabel,
                source: primaryMatch.source,
              }
            : null,
        };

        if (suggestedPrimary) {
          form.setValue("primaryTagId", suggestedPrimary, {
            shouldDirty: true,
          });
        }
        if (suggestedTagIds.length > 0) {
          form.setValue("tagIds", suggestedTagIds, { shouldDirty: true });
        }
        setTagSuggestion(suggestion);
      } catch {
        if (!cancelled) {
          setTagSuggestion(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    debouncedName,
    watchedDescription,
    watchedPaymentMethod,
    transactionType,
    open,
    isEditMode,
    workspaceId,
    userEditedTags,
    form,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const tags = tagsData?.data ?? [];
    if (tags.length === 0) {
      return;
    }

    const primaryTagId = form.getValues("primaryTagId");
    const tagIds = form.getValues("tagIds") ?? [];
    if (!primaryTagId && tagIds.length === 0) {
      return;
    }

    const isCompatibleTag = (tagId: string) => {
      const tag = tags.find((item) => item.id === tagId);
      if (!tag) {
        return true;
      }
      return tag.transactionType === transactionType;
    };

    const nextPrimaryTagId =
      primaryTagId && !isCompatibleTag(primaryTagId) ? null : primaryTagId;
    const nextTagIds = tagIds.filter(isCompatibleTag);

    if (nextPrimaryTagId !== primaryTagId) {
      form.setValue("primaryTagId", nextPrimaryTagId, { shouldDirty: true });
    }
    if (nextTagIds.length !== tagIds.length) {
      form.setValue("tagIds", nextTagIds, { shouldDirty: true });
    }
  }, [open, transactionType, tagsData?.data, form]);

  const handleTagFieldChange = () => {
    setUserEditedTags(true);
  };

  const handleRevertSuggestedTags = () => {
    if (!displayTagSuggestion) {
      return;
    }

    if (displayTagSuggestion.primaryTagId) {
      form.setValue("primaryTagId", displayTagSuggestion.primaryTagId, {
        shouldDirty: true,
      });
    }
    form.setValue("tagIds", displayTagSuggestion.tagIds, { shouldDirty: true });
    setUserEditedTags(false);
  };

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
      type: data.type,
      transferDirection:
        data.type === "TRANSFER" ? (data.transferDirection ?? "OUT") : null,
      ledgerAccountId: data.ledgerAccountId || null,
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
      if (isEditMode && workingTransaction) {
        updateTransaction(
          { transactionId: workingTransaction.id, input: submitData },
          {
            onSuccess: (updated) => {
              if (!isOfflineMutationPlaceholder(updated)) {
                setWorkingTransaction(updated);
                toast.success("Transaction updated successfully");
              }
              resetFormToClosedState();
              setPendingAction(null);
              onOpenChange(false);
              onSuccess?.();
            },
            onError: (error) => {
              setPendingAction(null);
              toast.error("Failed to update transaction");
              throw error;
            },
          },
        );
      } else {
        // Create new transaction - use appropriate hook based on type
        if (data.type === "EXPENSE") {
          createExpense(submitData, {
            onSuccess: (created) => {
              if (resolvedAfterSuccess === "addAnother") {
                resetFormForAnotherTransaction(data);
                setPendingAction(null);
                if (!isOfflineMutationPlaceholder(created)) {
                  toast.success("Expense created successfully");
                }
                onSuccess?.();
                focusFirstInput();
              } else {
                resetFormToClosedState();
                onOpenChange(false);
                setPendingAction(null);
                if (!isOfflineMutationPlaceholder(created)) {
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
        } else if (data.type === "TRANSFER") {
          createTransaction(submitData, {
            onSuccess: (created) => {
              resetFormToClosedState();
              onOpenChange(false);
              setPendingAction(null);
              if (!isOfflineMutationPlaceholder(created)) {
                toast.success("Transfer created successfully");
              }
              onSuccess?.();
            },
            onError: () => {
              setPendingAction(null);
              toast.error("Failed to create transfer");
            },
          });
        } else {
          createIncome(submitData, {
            onSuccess: (created) => {
              if (resolvedAfterSuccess === "addAnother") {
                resetFormForAnotherTransaction(data);
                setPendingAction(null);
                if (!isOfflineMutationPlaceholder(created)) {
                  toast.success("Income created successfully");
                }
                onSuccess?.();
                focusFirstInput();
              } else {
                resetFormToClosedState();
                onOpenChange(false);
                setPendingAction(null);
                if (!isOfflineMutationPlaceholder(created)) {
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

  const applyCreatedTransactionToForm = (
    created: ITransaction,
    data: FormData,
  ) => {
    setWorkingTransaction(created);
    form.reset({
      name: created.name,
      amount: created.amount,
      currency: created.currency,
      type: created.type,
      transactionDate: created.transactionDate,
      paymentMethod: created.paymentMethod,
      description: created.description ?? "",
      tagIds: created.tags.map((tag) => tag.id),
      primaryTagId: created.primaryTag?.id ?? null,
    });
    setHasTime(created.timePrecision === "DateTime");
    setShowAdvanced((data.tagIds?.length ?? 0) > 0);
    setTagSuggestion(null);
    setUserEditedTags(true);
  };

  const handleOpenAllocateRefund = async () => {
    if (pending) {
      return;
    }

    if (
      workingTransaction?.type === "INCOME" ||
      workingTransaction?.type === "EXPENSE"
    ) {
      setIsAllocateRefundOpen(true);
      onOpenChange(false);
      return;
    }

    const isValid = await form.trigger();
    if (!isValid) {
      toast.error(
        "Complete the required fields above before creating and linking.",
      );
      focusFirstInvalidField(form, { formElementId: formId });
      return;
    }

    const data = form.getValues();
    if (data.type !== "INCOME" && data.type !== "EXPENSE") {
      return;
    }

    setPendingAction("close");
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
      ledgerAccountId: data.ledgerAccountId || null,
    };

    try {
      const created =
        data.type === "INCOME"
          ? await createIncomeAsync(submitData)
          : await createExpenseAsync(submitData);
      if (isOfflineMutationPlaceholder(created)) {
        setPendingAction(null);
        toast.success(
          data.type === "INCOME"
            ? "Income created successfully"
            : "Expense created successfully",
        );
        onSuccess?.();
        return;
      }
      applyCreatedTransactionToForm(created, data);
      setPendingAction(null);
      toast.success(
        data.type === "INCOME"
          ? "Income created successfully"
          : "Expense created successfully",
      );
      setIsAllocateRefundOpen(true);
      resetFormToClosedState();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setPendingAction(null);
      toast.error(
        data.type === "INCOME"
          ? "Failed to create income"
          : "Failed to create expense",
      );
    }
  };

  const dialogTitle = isEditMode ? "Edit Transaction" : "Create Transaction";

  return (
    <>
      <ResponsiveDialog
        title={dialogTitle}
        disableInitialFocus
        content={
          <Form<FormData>
            form={form}
            onSubmit={(data) => processFormSubmit(data, "close")}
            id={formId}
          >
            <div className="space-y-4">
              <RadioGroup name="type" label="Type" required disabled={pending}>
                <RadioItem value="EXPENSE" icon={HiArrowTrendingDown}>
                  Expense
                </RadioItem>
                <RadioItem value="INCOME" icon={HiArrowTrendingUp}>
                  Income
                </RadioItem>
                <RadioItem value="TRANSFER" icon={HiArrowsRightLeft}>
                  Transfer
                </RadioItem>
              </RadioGroup>
              {transactionType === "TRANSFER" ? (
                <SelectDropdown
                  name="transferDirection"
                  label="Direction"
                  options={[
                    { value: "OUT", label: "Money out" },
                    { value: "IN", label: "Money in" },
                  ]}
                  disabled={pending}
                  required
                />
              ) : null}
              <LedgerAccountSelect name="ledgerAccountId" disabled={pending} />
              {isEditMode && workingTransaction ? (
                <PairTransferSection
                  transaction={workingTransaction}
                  onPaired={() => {
                    onOpenChange(false);
                    onSuccess?.();
                  }}
                />
              ) : null}
              <TextInput name="name" label="Name" disabled={pending} required />
              <div className="grid grid-cols-2 gap-4">
                <DecimalInput
                  name="amount"
                  label="Amount"
                  currency={watchedCurrency}
                  disabled={pending}
                  required
                />
                <CurrencySelect
                  name="currency"
                  label="Currency"
                  disabled={pending}
                  workspaceId={workspaceId}
                />
              </div>
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

              <div className="space-y-2">
                <TagSuggestionHint
                  tagSuggestions={displayTagSuggestion}
                  currentPrimaryTagId={watchedPrimaryTagId}
                  onRevert={handleRevertSuggestedTags}
                />
                <TagSelect
                  name="primaryTagId"
                  label="Primary Tag"
                  multiple={false}
                  placeholder="Select primary tag..."
                  disabled={pending}
                  transactionType={
                    transactionType === "TRANSFER" ? undefined : transactionType
                  }
                  hint="Used for budget, sorting and display"
                  onValueChange={handleTagFieldChange}
                />
              </div>

              <button
                type="button"
                className="flex items-center gap-1 text-sm text-info hover:underline disabled:opacity-50 disabled:pointer-events-none"
                disabled={pending}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? (
                  <HiChevronUp className="size-4 shrink-0" />
                ) : (
                  <HiChevronDown className="size-4 shrink-0" />
                )}
                {showAdvanced
                  ? "Hide additional tags"
                  : additionalTagCount > 0
                    ? `Show additional tags (${additionalTagCount})`
                    : "Show additional tags"}
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-1">
                  <TagSelect
                    name="tagIds"
                    label="Tags"
                    multiple={true}
                    placeholder="Select tags..."
                    disabled={pending}
                    transactionType={transactionType}
                    onValueChange={handleTagFieldChange}
                  />
                </div>
              )}

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

              {isEditMode && workingTransaction?.subscription && (
                <SubscriptionInfo
                  subscriptionId={workingTransaction.subscription.id}
                  subscriptionName={workingTransaction.subscription.name}
                  frequency={workingTransaction.subscription.frequency}
                  active={workingTransaction.subscription.active}
                  currentTransactionId={workingTransaction.id}
                />
              )}

              {(transactionType === "INCOME" ||
                transactionType === "EXPENSE") && (
                <div className="rounded-md border border-border p-3">
                  <div className="mb-2 text-sm text-text-muted">
                    {workingTransaction ? (
                      transactionType === "INCOME" ? (
                        <>
                          Remaining to allocate:{" "}
                          <span className="font-semibold text-text">
                            {workingTransaction.refundRemaining ??
                              workingTransaction.amount}{" "}
                            {workingTransaction.currency}
                          </span>
                        </>
                      ) : (
                        <>
                          Net after refunds:{" "}
                          <span className="font-semibold text-text">
                            {workingTransaction.expenseNet ??
                              workingTransaction.amount}{" "}
                            {workingTransaction.currency}
                          </span>
                        </>
                      )
                    ) : transactionType === "INCOME" ? (
                      "Link this income to expenses after creating it."
                    ) : (
                      "Link refund incomes to this expense after creating it."
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={pending}
                    clicked={() => {
                      void handleOpenAllocateRefund();
                    }}
                  >
                    <HiArrowUturnLeft className="size-4" />
                    {workingTransaction
                      ? transactionType === "INCOME"
                        ? "Allocate refund"
                        : "Link refund"
                      : transactionType === "INCOME"
                        ? "Create & allocate refund"
                        : "Create & link refund"}
                  </Button>
                </div>
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
                ? "Updating transaction"
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

      <AllocateRefundDialog
        open={isAllocateRefundOpen}
        onOpenChange={(nextOpen) => {
          setIsAllocateRefundOpen(nextOpen);
          if (!nextOpen) {
            setWorkingTransaction(undefined);
            setExpenseToOpenId(null);
          }
        }}
        transaction={workingTransaction ?? null}
        onSaved={setWorkingTransaction}
        onOpenTransaction={setExpenseToOpenId}
      />

      {expenseToOpenId != null && linkedTransaction != null ? (
        <AddOrEditTransactionDialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setExpenseToOpenId(null);
            }
          }}
          transaction={linkedTransaction}
        />
      ) : null}
    </>
  );
}
