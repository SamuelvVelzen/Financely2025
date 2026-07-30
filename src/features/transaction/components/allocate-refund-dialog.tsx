import { Currency } from "@/features/currency/components/currency";
import type {
  IRefundAllocationSuggestion,
  ITransaction,
} from "@/features/shared/validation/schemas";
import {
  useRefundAllocationSuggestions,
  useReplaceRefundAllocations,
} from "@/features/transaction/hooks/useTransactions";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { useToast } from "@/features/ui/toast";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { useEffect, useMemo, useState } from "react";
import { HiPlus, HiTrash } from "react-icons/hi2";

type IDraftAllocation = {
  expenseTransactionId: string;
  name: string;
  expenseNet: string;
  amount: string;
};

type IAllocateRefundDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: ITransaction | null;
};

function toDraftFromTransaction(
  transaction: ITransaction,
): IDraftAllocation[] {
  return (transaction.refundAllocations ?? []).map((allocation) => ({
    expenseTransactionId: allocation.expenseTransactionId,
    name: allocation.expenseTransaction?.name ?? "Expense",
    expenseNet: allocation.expenseTransaction?.amount ?? allocation.amount,
    amount: allocation.amount,
  }));
}

export function AllocateRefundDialog({
  open,
  onOpenChange,
  transaction,
}: IAllocateRefundDialogProps) {
  const toast = useToast();
  const replaceMutation = useReplaceRefundAllocations();
  const [drafts, setDrafts] = useState<IDraftAllocation[]>([]);

  const transactionId = transaction?.id ?? null;
  const suggestionsQuery = useRefundAllocationSuggestions(
    transactionId,
    open && transaction?.type === "INCOME",
  );

  useEffect(() => {
    if (open && transaction) {
      setDrafts(toDraftFromTransaction(transaction));
    }
  }, [open, transaction]);

  const refundAmount = parseFloat(transaction?.amount ?? "0");
  const allocatedTotal = drafts.reduce(
    (sum, draft) => sum + (parseFloat(draft.amount) || 0),
    0,
  );
  const remaining = Math.round((refundAmount - allocatedTotal) * 100) / 100;

  const suggestionList = useMemo(() => {
    const selected = new Set(drafts.map((d) => d.expenseTransactionId));
    return (suggestionsQuery.data?.suggestions ?? []).filter(
      (suggestion) => !selected.has(suggestion.id),
    );
  }, [drafts, suggestionsQuery.data?.suggestions]);

  const addSuggestion = (suggestion: IRefundAllocationSuggestion) => {
    const maxAmount = Math.min(
      parseFloat(suggestion.expenseNet),
      Math.max(0, remaining),
    );
    if (!(maxAmount > 0)) {
      return;
    }
    setDrafts((current) => [
      ...current,
      {
        expenseTransactionId: suggestion.id,
        name: suggestion.name,
        expenseNet: suggestion.expenseNet,
        amount: maxAmount.toString(),
      },
    ]);
  };

  const updateAmount = (expenseTransactionId: string, amount: string) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.expenseTransactionId === expenseTransactionId
          ? { ...draft, amount }
          : draft,
      ),
    );
  };

  const removeDraft = (expenseTransactionId: string) => {
    setDrafts((current) =>
      current.filter(
        (draft) => draft.expenseTransactionId !== expenseTransactionId,
      ),
    );
  };

  const handleSave = async () => {
    if (!transaction) {
      return;
    }
    if (remaining < -0.001) {
      toast.error("Reduce allocation amounts so they do not exceed the refund.");
      return;
    }

    try {
      await replaceMutation.mutateAsync({
        transactionId: transaction.id,
        allocations: drafts.map((draft) => ({
          expenseTransactionId: draft.expenseTransactionId,
          amount: draft.amount,
        })),
      });
      toast.success("Allocations were saved successfully.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  };

  if (!transaction || transaction.type !== "INCOME") {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Allocate refund"
      size="lg"
      content={
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            Link this income to one or more expenses. Allocated amounts reduce
            those expense categories in budgets; any remainder stays as income.
          </p>

          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-text-muted">Refund </span>
              <Currency
                amount={transaction.amount}
                currency={transaction.currency}
                type="INCOME"
                className="font-semibold"
              />
            </div>
            <div>
              <span className="text-text-muted">Remaining </span>
              <span
                className={
                  remaining < 0 ? "font-semibold text-danger" : "font-semibold"
                }>
                {remaining}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Current allocations</h3>
            {drafts.length === 0 ? (
              <p className="text-sm text-text-muted">No allocations yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {drafts.map((draft) => (
                  <li
                    key={draft.expenseTransactionId}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{draft.name}</div>
                      <div className="text-xs text-text-muted">
                        Available up to {draft.expenseNet}
                      </div>
                    </div>
                    <div className="w-28">
                      <DecimalInput
                        value={draft.amount}
                        currency={transaction.currency}
                        onChange={(value) =>
                          updateAmount(
                            draft.expenseTransactionId,
                            value == null ? "" : String(value),
                          )
                        }
                        aria-label={`Allocation amount for ${draft.name}`}
                      />
                    </div>
                    <IconButton
                      ariaLabel={`Remove allocation for ${draft.name}`}
                      clicked={() => removeDraft(draft.expenseTransactionId)}
                      icon={<HiTrash className="size-4" />}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Suggestions</h3>
            {suggestionsQuery.isLoading ? (
              <p className="text-sm text-text-muted">Loading suggestions…</p>
            ) : suggestionList.length === 0 ? (
              <p className="text-sm text-text-muted">
                No matching expenses with remaining amount.
              </p>
            ) : (
              <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                {suggestionList.map((suggestion) => (
                  <li
                    key={suggestion.id}
                    className="flex items-center gap-2 rounded-md border border-border/60 p-2">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {suggestion.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {DateFormatHelpers.formatIsoStringToString(
                          suggestion.transactionDate,
                          "DateOnly",
                        )}{" "}
                        · net {suggestion.expenseNet} {suggestion.currency}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      clicked={() => addSuggestion(suggestion)}
                      disabled={remaining <= 0}>
                      <HiPlus className="size-4" />
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      }
      footerButtons={[
        {
          children: "Cancel",
          variant: "default",
          clicked: () => onOpenChange(false),
        },
        {
          children: replaceMutation.isPending ? "Saving…" : "Save",
          variant: "primary",
          clicked: () => {
            void handleSave();
          },
          disabled: replaceMutation.isPending || remaining < -0.001,
        },
      ]}
    />
  );
}
