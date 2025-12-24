"use client";

import {
  CreateTransactionInputSchema,
  CurrencySchema,
  getCurrencyOptions,
  type ITransaction,
} from "@/features/shared/validation/schemas";
import {
  useCreateIncome,
  useUpdateIncome,
} from "@/features/transaction/hooks/useTransactions";
import { PAYMENT_METHOD_OPTIONS } from "@/features/transaction/config/payment-methods";
import { CurrencySelect } from "@/features/currency/components/currency-select";
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

type IAddOrCreateIncomeDialog = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: ITransaction;
  onSuccess?: () => void;
};

// Form schema that matches CreateTransactionInputSchema but with localized string amount for the form
const IncomeFormSchema = CreateTransactionInputSchema.omit({
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
});

type FormData = z.infer<typeof IncomeFormSchema>;

// Currency options extracted from CurrencySchema
const currencyOptions = getCurrencyOptions();
const getEmptyFormValues = (): FormData => ({
  name: "",
  amount: "",
  currency: "EUR",
  occurredAt: "",
  paymentMethod: "OTHER",
  description: "",
  tagIds: [],
});

export function AddOrCreateIncomeDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: IAddOrCreateIncomeDialog) {
  const [pending, setPending] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const isEditMode = !!transaction;
  const { mutate: createIncome } = useCreateIncome();
  const { mutate: updateIncome } = useUpdateIncome();
  const toast = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(IncomeFormSchema) as Resolver<FormData>,
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
    };

    try {
      if (isEditMode && transaction) {
        // Update existing income
        updateIncome(
          { transactionId: transaction.id, input: submitData },
          {
            onSuccess: () => {
              resetFormToClosedState();
              setPending(false);
              onOpenChange(false);
              toast.success("Income updated successfully");
              onSuccess?.();
            },
            onError: (error) => {
              setPending(false);
              toast.error("Failed to update income");
              throw error;
            },
          }
        );
      } else {
        // Create new income
        createIncome(submitData, {
          onSuccess: () => {
            resetFormToClosedState();
            setPending(false);
            onOpenChange(false);
            toast.success("Income created successfully");
            onSuccess?.();
          },
          onError: (error) => {
            setPending(false);
            toast.error("Failed to create income");
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
        title={isEditMode ? "Edit Income" : "Create Income"}
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
                name="tagIds"
                label="Tags"
                multiple={true}
                placeholder="Select tags..."
                disabled={pending}
                transactionType="INCOME"
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
            disabled: pending,
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
