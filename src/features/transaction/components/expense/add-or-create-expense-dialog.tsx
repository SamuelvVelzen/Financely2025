"use client";

import { CurrencySelect } from "@/features/currency/components/currency-select";
import {
  CreateTransactionInputSchema,
  CurrencySchema,
  type ITransaction,
} from "@/features/shared/validation/schemas";
import { PAYMENT_METHOD_OPTIONS } from "@/features/transaction/config/payment-methods";
import {
  useCreateExpense,
  useUpdateExpense,
} from "@/features/transaction/hooks/useTransactions";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { DateInput } from "@/features/ui/input/date-input";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { TextInput } from "@/features/ui/input/text-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { TagSelect } from "@/features/ui/tag-select/tag-select";
import { useToast } from "@/features/ui/toast";
import {
  datetimeLocalToIso,
  isoToDatetimeLocal,
} from "@/features/util/date/dateisohelpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

type IAddOrCreateExpenseDialog = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: ITransaction;
  onSuccess?: () => void;
};

// Form schema that matches CreateTransactionInputSchema but with localized string amount for the form
const ExpenseFormSchema = CreateTransactionInputSchema.omit({
  type: true,
  amount: true,
  occurredAt: true,
}).extend({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0;
    }, "Amount must be positive"),
  occurredAt: z.string().min(1, "Date is required"),
  tagIds: z.array(z.string()).optional().default([]),
  primaryTagId: z.string().nullable().optional(),
});

type FormData = z.infer<typeof ExpenseFormSchema>;
const getEmptyFormValues = (): FormData => ({
  name: "",
  amount: "",
  currency: "EUR",
  occurredAt: "",
  paymentMethod: "OTHER",
  description: "",
  tagIds: [],
  primaryTagId: null,
});

export function AddOrCreateExpenseDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: IAddOrCreateExpenseDialog) {
  const [pending, setPending] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const isEditMode = !!transaction;
  const { mutate: createExpense } = useCreateExpense();
  const { mutate: updateExpense } = useUpdateExpense();
  const toast = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(ExpenseFormSchema) as Resolver<FormData>,
    defaultValues: getEmptyFormValues(),
  });
  const hasUnsavedChanges = form.formState.isDirty;

  const resetFormToClosedState = () => {
    form.reset(getEmptyFormValues());
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
        form.reset({
          name: transaction.name,
          amount: transaction.amount,
          currency: transaction.currency,
          occurredAt: isoToDatetimeLocal(transaction.occurredAt),
          paymentMethod: transaction.paymentMethod,
          description: transaction.description ?? "",
          tagIds: transaction.tags.map((tag) => tag.id),
          primaryTagId: transaction.primaryTag?.id ?? null,
        });
      } else {
        // Create mode: reset to defaults with current date/time
        const now = new Date();
        form.reset({
          name: "",
          amount: "",
          currency: "EUR",
          occurredAt: isoToDatetimeLocal(now.toISOString()),
          paymentMethod: "OTHER",
          description: "",
          tagIds: [],
          primaryTagId: null,
        });
      }
    } else {
      // Reset form when dialog closes to ensure clean state
      form.reset(getEmptyFormValues());
    }
  }, [open, transaction?.id, form]);

  const handleSubmit = async (data: FormData) => {
    setPending(true);

    // Transform form data to API format
    const submitData = {
      name: data.name.trim(),
      amount: data.amount.trim(),
      currency: CurrencySchema.parse(data.currency),
      occurredAt: datetimeLocalToIso(data.occurredAt),
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
        // Update existing expense
        updateExpense(
          { transactionId: transaction.id, input: submitData },
          {
            onSuccess: () => {
              resetFormToClosedState();
              setPending(false);
              onOpenChange(false);
              toast.success("Expense updated successfully");
              onSuccess?.();
            },
            onError: (error) => {
              setPending(false);
              toast.error("Failed to update expense");
              throw error;
            },
          }
        );
      } else {
        // Create new expense
        createExpense(submitData, {
          onSuccess: () => {
            resetFormToClosedState();
            setPending(false);
            onOpenChange(false);
            toast.success("Expense created successfully");
            onSuccess?.();
          },
          onError: (error) => {
            setPending(false);
            toast.error("Failed to create expense");
            throw error;
          },
        });
      }
    } catch (err) {
      setPending(false);
      throw err; // Let Form component handle the error
    }
  };

  return (
    <>
      <Dialog
        title={isEditMode ? "Edit Expense" : "Create Expense"}
        content={
          <Form<FormData>
            form={form}
            onSubmit={handleSubmit}>
            <div className="space-y-4">
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
              <DateInput
                name="occurredAt"
                label="Date & Time"
                type="datetime-local"
                disabled={pending}
                required
              />
              <SelectDropdown
                name="paymentMethod"
                label="Payment Method"
                options={PAYMENT_METHOD_OPTIONS}
                placeholder="Select payment method..."
                disabled={pending}
              />
              <TextInput
                name="description"
                label="Description"
                disabled={pending}
              />
              <TagSelect
                name="primaryTagId"
                label="Primary Tag"
                multiple={false}
                placeholder="Select primary tag..."
                disabled={pending}
                transactionType="EXPENSE"
                hint="Used for budget, sorting and display"
              />
              <TagSelect
                name="tagIds"
                label="Tags"
                multiple={true}
                placeholder="Select tags..."
                disabled={pending}
                transactionType="EXPENSE"
              />
            </div>
          </Form>
        }
        footerButtons={[
          {
            clicked: handleAttemptClose,
            disabled: pending,
            buttonContent: "Cancel",
          },
          {
            clicked: () => {
              form.handleSubmit(handleSubmit)();
            },
            variant: "primary",
            type: "submit",
            buttonContent: pending
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update"
                : "Create",
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
