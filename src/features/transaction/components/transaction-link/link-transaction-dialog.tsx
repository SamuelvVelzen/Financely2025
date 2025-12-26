"use client";

import { formatCurrency } from "@/features/currency/utils/currencyhelpers";
import {
  type ITransaction,
  type ITransactionLink,
} from "@/features/shared/validation/schemas";
import {
  useCreateTransactionLink,
  useTransactionLinks,
  useUpdateTransactionLink,
} from "@/features/transaction/hooks/useTransactionLinks";
import {
  useExpenses,
  useIncomes,
} from "@/features/transaction/hooks/useTransactions";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { useToast } from "@/features/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { type Resolver } from "react-hook-form";
import { z } from "zod";

type ILinkTransactionDialog = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: ITransaction;
  link?: ITransactionLink;
  onSuccess?: () => void;
};

// Form schema for creating/editing a link
const LinkFormSchema = z.object({
  linkedTransactionId: z.string().min(1, "Please select a transaction"),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0;
    }, "Amount must be positive"),
});

type LinkFormData = z.infer<typeof LinkFormSchema>;

export function LinkTransactionDialog({
  open,
  onOpenChange,
  transaction,
  link,
  onSuccess,
}: ILinkTransactionDialog) {
  const [pending, setPending] = useState(false);
  const isEditMode = !!link;
  const { mutate: createLink } = useCreateTransactionLink();
  const { mutate: updateLink } = useUpdateTransactionLink();
  const toast = useToast();

  // Determine which type of transactions to show
  const isExpense = transaction.type === "EXPENSE";
  const targetType = isExpense ? "INCOME" : "EXPENSE";

  // Fetch available transactions to link
  const { data: incomesData } = useIncomes(
    isExpense ? { page: 1, limit: 1000, tagIds: undefined } : undefined,
    {
      enabled: isExpense,
    }
  );
  const { data: expensesData } = useExpenses(
    !isExpense ? { page: 1, limit: 1000, tagIds: undefined } : undefined,
    {
      enabled: !isExpense,
    }
  );

  // Get transactions of the target type
  const availableTransactions = isExpense
    ? (incomesData?.data ?? [])
    : (expensesData?.data ?? []);

  // Filter out transactions with different currency
  const filteredTransactions = useMemo(() => {
    return availableTransactions.filter(
      (tx) => tx.currency === transaction.currency
    );
  }, [availableTransactions, transaction.currency]);

  // Get existing links for this transaction to calculate remaining amounts
  const { data: linksData } = useTransactionLinks(transaction.id);
  const existingLinks = linksData?.data ?? [];

  // Calculate remaining available amount for the transaction
  const totalLinkedAmount = useMemo(() => {
    if (isExpense) {
      // For expenses, sum all income links
      return existingLinks
        .filter((l) => l.expenseId === transaction.id)
        .reduce((sum, l) => sum + Number(l.amount), 0);
    } else {
      // For incomes, sum all expense links
      return existingLinks
        .filter((l) => l.incomeId === transaction.id)
        .reduce((sum, l) => sum + Number(l.amount), 0);
    }
  }, [existingLinks, transaction.id, isExpense]);

  const remainingAmount =
    Number(transaction.amount) -
    totalLinkedAmount +
    (link ? Number(link.amount) : 0);

  // Create options for transaction select
  const transactionOptions = useMemo(() => {
    return filteredTransactions.map((tx) => {
      // Calculate remaining amount for this transaction
      const txLinks = existingLinks.filter(
        (l) =>
          (isExpense && l.incomeId === tx.id) ||
          (!isExpense && l.expenseId === tx.id)
      );
      const txLinkedAmount = txLinks.reduce(
        (sum, l) => sum + Number(l.amount),
        0
      );
      const txRemaining =
        Number(tx.amount) -
        txLinkedAmount +
        (link &&
        ((isExpense && link.incomeId === tx.id) ||
          (!isExpense && link.expenseId === tx.id))
          ? Number(link.amount)
          : 0);

      return {
        value: tx.id,
        label: `${tx.name} (${formatCurrency(tx.amount, tx.currency)}) - Remaining: ${formatCurrency(txRemaining.toString(), tx.currency)}`,
        data: tx,
      };
    });
  }, [filteredTransactions, existingLinks, isExpense, link]);

  const form = useFinForm<LinkFormData>({
    resolver: zodResolver(LinkFormSchema) as Resolver<LinkFormData>,
    defaultValues: {
      linkedTransactionId: "",
      amount: "",
    },
  });

  // Reset form when dialog opens/closes or link changes
  useEffect(() => {
    if (open) {
      if (link) {
        // Edit mode: populate form with existing link data
        form.reset({
          linkedTransactionId: isExpense ? link.incomeId : link.expenseId,
          amount: link.amount,
        });
      } else {
        // Create mode: reset to defaults
        form.reset({
          linkedTransactionId: "",
          amount: "",
        });
      }
    }
  }, [open, link?.id, form, isExpense]);

  const handleSubmit = async (data: LinkFormData) => {
    setPending(true);

    const amountNum = Number(data.amount);
    if (amountNum > remainingAmount) {
      form.setError("amount", {
        type: "manual",
        message: `Amount cannot exceed remaining available amount (${formatCurrency(remainingAmount.toString(), transaction.currency)})`,
      });
      setPending(false);
      return;
    }

    try {
      if (isEditMode && link) {
        // Update existing link
        updateLink(
          {
            linkId: link.id,
            input: { amount: data.amount },
          },
          {
            onSuccess: () => {
              form.reset();
              setPending(false);
              onOpenChange(false);
              toast.success("Link updated successfully");
              onSuccess?.();
            },
            onError: (error: Error) => {
              setPending(false);
              toast.error(
                error instanceof Error ? error.message : "Failed to update link"
              );
            },
          }
        );
      } else {
        // Create new link
        const input = {
          incomeId: isExpense ? data.linkedTransactionId : transaction.id,
          expenseId: isExpense ? transaction.id : data.linkedTransactionId,
          amount: data.amount,
        };

        createLink(input, {
          onSuccess: () => {
            form.reset();
            setPending(false);
            onOpenChange(false);
            toast.success("Link created successfully");
            onSuccess?.();
          },
          onError: (error: Error) => {
            setPending(false);
            toast.error(
              error instanceof Error ? error.message : "Failed to create link"
            );
          },
        });
      }
    } catch (err) {
      setPending(false);
      throw err;
    }
  };

  return (
    <Dialog
      title={
        isEditMode ? "Edit Link" : `Link ${isExpense ? "Income" : "Expense"}`
      }
      content={
        <Form<LinkFormData>
          form={form}
          onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="p-3 bg-surface-hover rounded-lg">
              <p className="text-sm font-medium text-text">
                {transaction.name}
              </p>
              <p className="text-sm text-text-muted">
                Amount:{" "}
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
              <p className="text-sm text-text-muted">
                Remaining:{" "}
                {formatCurrency(
                  remainingAmount.toString(),
                  transaction.currency
                )}
              </p>
            </div>

            <SelectDropdown
              name="linkedTransactionId"
              label={`Select ${isExpense ? "Income" : "Expense"} to Link`}
              options={transactionOptions}
              placeholder={`Select ${isExpense ? "income" : "expense"}...`}
              multiple={false}
            />

            <DecimalInput
              name="amount"
              label="Link Amount"
              disabled={pending}
              required
              max={remainingAmount}
            />

            {remainingAmount < Number(transaction.amount) && (
              <p className="text-sm text-text-muted">
                {isExpense ? "Paid" : "Allocated"}:{" "}
                {formatCurrency(
                  (Number(transaction.amount) - remainingAmount).toString(),
                  transaction.currency
                )}{" "}
                of {formatCurrency(transaction.amount, transaction.currency)}
              </p>
            )}
          </div>
        </Form>
      }
      footerButtons={[
        {
          clicked: () => {
            form.reset();
            onOpenChange(false);
          },
          disabled: pending,
          buttonContent: "Cancel",
        },
        {
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
      onOpenChange={onOpenChange}
      dismissible={!pending}
      variant="modal"
      size="md"
    />
  );
}
