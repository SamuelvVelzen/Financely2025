"use client";

import {
  CreateTransactionInputSchema,
  CurrencySchema,
  type ITransaction,
} from "@/features/shared/validation/schemas";
import {
  useCreateExpense,
  useUpdateExpense,
} from "@/features/transaction/hooks/useTransactions";
import { CurrencySelect } from "@/features/ui/currency-select/currency-select";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { DateInput } from "@/features/ui/input/date-input";
import { NumberInput } from "@/features/ui/input/number-input";
import { TextInput } from "@/features/ui/input/text-input";
import { TagSelect } from "@/features/ui/tag-select/tag-select";
import {
  datetimeLocalToIso,
  isoToDatetimeLocal,
} from "@/util/date/dateisohelpers";
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

// Form schema that matches CreateTransactionInputSchema but with amount as number for the form
const ExpenseFormSchema = CreateTransactionInputSchema.omit({
  type: true,
  amount: true,
  occurredAt: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  occurredAt: z.string().min(1, "Date is required"),
  tagIds: z.array(z.string()).optional().default([]),
});

type FormData = z.infer<typeof ExpenseFormSchema>;
const getEmptyFormValues = (): FormData => ({
  name: "",
  amount: 0,
  currency: "EUR",
  occurredAt: "",
  description: "",
  tagIds: [],
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
          amount: parseFloat(transaction.amount),
          currency: transaction.currency,
          occurredAt: isoToDatetimeLocal(transaction.occurredAt),
          description: transaction.description ?? "",
          tagIds: transaction.tags.map((tag) => tag.id),
        });
      } else {
        // Create mode: reset to defaults with current date/time
        const now = new Date();
        form.reset({
          name: "",
          amount: 0,
          currency: "EUR",
          occurredAt: isoToDatetimeLocal(now.toISOString()),
          description: "",
          tagIds: [],
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
      amount: data.amount.toString(),
      currency: CurrencySchema.parse(data.currency),
      occurredAt: datetimeLocalToIso(data.occurredAt),
      description:
        data.description && data.description.trim() !== ""
          ? data.description.trim()
          : null,
      tagIds: data.tagIds || [],
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
              onSuccess?.();
            },
            onError: (error) => {
              setPending(false);
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
            onSuccess?.();
          },
          onError: (error) => {
            setPending(false);
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
          <Form<FormData> form={form} onSubmit={handleSubmit}>
            <div className="space-y-4">
              <TextInput name="name" label="Name" disabled={pending} required />
              <div className="grid grid-cols-2 gap-4">
                <NumberInput
                  name="amount"
                  label="Amount"
                  disabled={pending}
                  min={0}
                  step={0.01}
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
              <TextInput
                name="description"
                label="Description"
                disabled={pending}
              />
              <TagSelect
                name="tagIds"
                label="Tags"
                multiple={true}
                placeholder="Select tags..."
                disabled={pending}
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
