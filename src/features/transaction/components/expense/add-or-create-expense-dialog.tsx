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

export function AddOrCreateExpenseDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: IAddOrCreateExpenseDialog) {
  const [pending, setPending] = useState(false);
  const isEditMode = !!transaction;
  const { mutate: createExpense } = useCreateExpense();
  const { mutate: updateExpense } = useUpdateExpense();

  const form = useForm<FormData>({
    resolver: zodResolver(ExpenseFormSchema) as Resolver<FormData>,
    defaultValues: {
      name: "",
      amount: 0,
      currency: "EUR",
      occurredAt: "",
      description: "",
      tagIds: [],
    },
  });

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
      form.reset({
        name: "",
        amount: 0,
        currency: "EUR",
        occurredAt: "",
        description: "",
        tagIds: [],
      });
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
              form.reset({
                name: "",
                amount: 0,
                currency: "EUR",
                occurredAt: "",
                description: "",
                tagIds: [],
              });
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
            form.reset({
              name: "",
              amount: 0,
              currency: "EUR",
              occurredAt: "",
              description: "",
              tagIds: [],
            });
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
          clicked: () => {
            form.reset({
              name: "",
              amount: 0,
              currency: "EUR",
              occurredAt: "",
              description: "",
              tagIds: [],
            });
            onOpenChange(false);
          },
          className: `px-4 py-2 border border-border rounded-lg hover:bg-surface-hover motion-safe:transition-colors ${pending ? "opacity-50 cursor-not-allowed" : ""}`,
          buttonContent: "Cancel",
        },
        {
          clicked: () => {
            form.handleSubmit(handleSubmit)();
          },
          className: `px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors ${pending ? "opacity-50 cursor-not-allowed" : ""}`,
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
      onOpenChange={onOpenChange}
      dismissible={!pending}
      variant="modal"
      size="xl"
    />
  );
}
