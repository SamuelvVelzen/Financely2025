import { Currency } from "@/features/currency/components/currency";
import type {
  IRefundAllocationSuggestion,
  ITransaction,
} from "@/features/shared/validation/schemas";
import { AllocateRefundAllocationRow } from "@/features/transaction/components/allocate-refund-allocation-row";
import { AllocateRefundSuggestionRow } from "@/features/transaction/components/allocate-refund-suggestion-row";
import {
  useRefundAllocationSuggestions,
  useReplaceRefundAllocations,
} from "@/features/transaction/hooks/useTransactions";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { ResponsiveDialog } from "@/features/ui/dialog/responsive-dialog";
import { List } from "@/features/ui/list/list";
import { useToast } from "@/features/ui/toast";
import { useMemo, useState } from "react";

type IDraftAllocation = {
  counterpartId: string;
  name: string;
  available: string;
  amount: string;
};

type IAllocateRefundDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: ITransaction | null;
  onSaved?: (transaction: ITransaction) => void;
  onOpenTransaction?: (transactionId: string) => void;
};

function toDraftFromTransaction(
  transaction: ITransaction,
): IDraftAllocation[] {
  if (transaction.type === "INCOME") {
    return (transaction.refundAllocations ?? []).map((allocation) => {
      const expenseAmount = parseFloat(
        allocation.expenseTransaction?.amount ?? allocation.amount,
      );
      const current = parseFloat(allocation.amount);
      // Gross expense is the hard cap; current link still counts toward that.
      const available = Number.isFinite(expenseAmount)
        ? expenseAmount.toString()
        : allocation.amount;
      return {
        counterpartId: allocation.expenseTransactionId,
        name: allocation.expenseTransaction?.name ?? "Expense",
        available,
        amount: Number.isFinite(current) ? current.toString() : allocation.amount,
      };
    });
  }

  return (transaction.expenseRefundAllocations ?? []).map((allocation) => {
    const refundAmount = parseFloat(
      allocation.refundTransaction?.amount ?? allocation.amount,
    );
    const current = parseFloat(allocation.amount);
    const available = Number.isFinite(refundAmount)
      ? refundAmount.toString()
      : allocation.amount;
    return {
      counterpartId: allocation.refundTransactionId,
      name: allocation.refundTransaction?.name ?? "Refund",
      available,
      amount: Number.isFinite(current) ? current.toString() : allocation.amount,
    };
  });
}

export function AllocateRefundDialog({
  open,
  onOpenChange,
  transaction,
  onSaved,
  onOpenTransaction,
}: IAllocateRefundDialogProps) {
  if (!open || !transaction) {
    return null;
  }

  const isIncome = transaction.type === "INCOME";
  const isExpense = transaction.type === "EXPENSE";
  if (!isIncome && !isExpense) {
    return null;
  }

  return (
    <AllocateRefundDialogContent
      key={transaction.id}
      open={open}
      onOpenChange={onOpenChange}
      transaction={transaction}
      onSaved={onSaved}
      onOpenTransaction={onOpenTransaction}
    />
  );
}

function AllocateRefundDialogContent({
  open,
  onOpenChange,
  transaction,
  onSaved,
  onOpenTransaction,
}: IAllocateRefundDialogProps & { transaction: ITransaction }) {
  const toast = useToast();
  const replaceMutation = useReplaceRefundAllocations();
  const [drafts, setDrafts] = useState(() =>
    toDraftFromTransaction(transaction),
  );
  const [draftToRemove, setDraftToRemove] = useState<IDraftAllocation | null>(
    null,
  );

  const isIncome = transaction.type === "INCOME";
  const isExpense = transaction.type === "EXPENSE";
  const suggestionsQuery = useRefundAllocationSuggestions(
    transaction.id,
    open && (isIncome || isExpense),
  );

  const sourceAmount = parseFloat(transaction.amount ?? "0");
  const allocatedTotal = drafts.reduce(
    (sum, draft) => sum + (parseFloat(draft.amount) || 0),
    0,
  );
  const remaining = Math.round((sourceAmount - allocatedTotal) * 100) / 100;

  const getMaxForDraft = (counterpartId: string) => {
    const othersTotal = drafts
      .filter((draft) => draft.counterpartId !== counterpartId)
      .reduce((sum, draft) => sum + (parseFloat(draft.amount) || 0), 0);
    const row = drafts.find((draft) => draft.counterpartId === counterpartId);
    const counterpartCap = parseFloat(row?.available ?? "0");
    return Math.max(
      0,
      Math.min(
        Number.isFinite(counterpartCap) ? counterpartCap : sourceAmount,
        sourceAmount - othersTotal,
      ),
    );
  };

  const hasOverMaxDraft = drafts.some((draft) => {
    const amount = parseFloat(draft.amount) || 0;
    const maxForRow = Math.round(getMaxForDraft(draft.counterpartId) * 100) / 100;
    return amount > maxForRow + 0.001;
  });

  const suggestionList = useMemo(() => {
    const selected = new Set(drafts.map((d) => d.counterpartId));
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
        counterpartId: suggestion.id,
        name: suggestion.name,
        available: suggestion.expenseNet,
        amount: maxAmount.toString(),
      },
    ]);
  };

  const updateAmount = (counterpartId: string, amount: string) => {
    setDrafts((current) => {
      const othersTotal = current
        .filter((draft) => draft.counterpartId !== counterpartId)
        .reduce((sum, draft) => sum + (parseFloat(draft.amount) || 0), 0);
      const row = current.find((draft) => draft.counterpartId === counterpartId);
      const counterpartCap = parseFloat(row?.available ?? "0");
      const maxForRow = Math.max(
        0,
        Math.min(
          Number.isFinite(counterpartCap) ? counterpartCap : sourceAmount,
          sourceAmount - othersTotal,
        ),
      );
      const roundedMax = Math.round(maxForRow * 100) / 100;

      let nextAmount = amount;
      if (amount !== "") {
        const parsed = parseFloat(amount);
        if (Number.isFinite(parsed) && parsed > roundedMax) {
          nextAmount = roundedMax.toString();
        }
      }

      return current.map((draft) =>
        draft.counterpartId === counterpartId
          ? { ...draft, amount: nextAmount }
          : draft,
      );
    });
  };

  const confirmRemoveDraft = () => {
    if (!draftToRemove) {
      return;
    }
    setDrafts((current) =>
      current.filter(
        (draft) => draft.counterpartId !== draftToRemove.counterpartId,
      ),
    );
    setDraftToRemove(null);
  };

  const handleSave = async () => {
    if (!transaction) {
      return;
    }

    const clampedDrafts = drafts.map((draft) => {
      const maxForRow = Math.round(getMaxForDraft(draft.counterpartId) * 100) / 100;
      const parsed = parseFloat(draft.amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return { ...draft, amount: "0" };
      }
      return {
        ...draft,
        amount: Math.min(parsed, maxForRow).toString(),
      };
    });

    const clampedTotal = clampedDrafts.reduce(
      (sum, draft) => sum + (parseFloat(draft.amount) || 0),
      0,
    );
    const clampedRemaining =
      Math.round((sourceAmount - clampedTotal) * 100) / 100;

    if (clampedRemaining < -0.001) {
      toast.error(
        isIncome
          ? "Reduce allocation amounts so they do not exceed the refund."
          : "Reduce allocation amounts so they do not exceed the expense.",
      );
      setDrafts(clampedDrafts);
      return;
    }

    const overCounterpart = clampedDrafts.some((draft) => {
      const maxForRow = Math.round(getMaxForDraft(draft.counterpartId) * 100) / 100;
      return (parseFloat(draft.amount) || 0) > maxForRow + 0.001;
    });
    if (overCounterpart) {
      toast.error("One or more allocations exceed the allowed maximum.");
      setDrafts(clampedDrafts);
      return;
    }

    setDrafts(clampedDrafts);

    try {
      const updated = await replaceMutation.mutateAsync({
        transactionId: transaction.id,
        allocations: isIncome
          ? clampedDrafts
              .filter((draft) => (parseFloat(draft.amount) || 0) > 0)
              .map((draft) => ({
                expenseTransactionId: draft.counterpartId,
                amount: draft.amount,
              }))
          : clampedDrafts
              .filter((draft) => (parseFloat(draft.amount) || 0) > 0)
              .map((draft) => ({
                refundTransactionId: draft.counterpartId,
                amount: draft.amount,
              })),
      });
      toast.success("Allocations were saved successfully.");
      onSaved?.(updated);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  };

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isIncome ? "Allocate refund" : "Link refunds"}
        size="lg"
        content={
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-muted">
              {isIncome
                ? "Link this income to one or more expenses. Allocated amounts reduce those expense categories in budgets; any remainder stays as income."
                : "Link one or more refund incomes to this expense. Allocated amounts reduce this expense in budgets."}
            </p>

            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-text-muted">
                  {isIncome ? "Refund " : "Expense "}
                </span>
                <Currency
                  amount={transaction.amount}
                  currency={transaction.currency}
                  type={transaction.type}
                  className="font-semibold"
                />
              </div>
              <div>
                <span className="text-text-muted">Remaining </span>
                <span
                  className={
                    remaining < 0
                      ? "font-semibold text-danger"
                      : "font-semibold"
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
                <List
                  className="max-h-56 overflow-y-auto"
                  data={drafts}
                  getItemKey={(draft) => draft.counterpartId}>
                  {(draft) => (
                    <AllocateRefundAllocationRow
                      name={draft.name}
                      amount={draft.amount}
                      currency={transaction.currency}
                      maxAmount={getMaxForDraft(draft.counterpartId)}
                      onAmountChange={(amount) =>
                        updateAmount(draft.counterpartId, amount)
                      }
                      onRemove={() => setDraftToRemove(draft)}
                      onOpen={
                        onOpenTransaction
                          ? () => onOpenTransaction(draft.counterpartId)
                          : undefined
                      }
                    />
                  )}
                </List>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold">Suggestions</h3>
              {suggestionsQuery.isLoading ? (
                <p className="text-sm text-text-muted">Loading suggestions…</p>
              ) : suggestionList.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {isIncome
                    ? "No matching expenses with remaining amount."
                    : "No matching refunds with remaining amount."}
                </p>
              ) : (
                <List
                  className="max-h-56 overflow-y-auto"
                  data={suggestionList}
                  getItemKey={(suggestion) => suggestion.id}>
                  {(suggestion) => (
                    <AllocateRefundSuggestionRow
                      suggestion={suggestion}
                      disabled={remaining <= 0}
                      onAdd={() => addSuggestion(suggestion)}
                      onOpen={
                        onOpenTransaction
                          ? () => onOpenTransaction(suggestion.id)
                          : undefined
                      }
                    />
                  )}
                </List>
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
            disabled:
              replaceMutation.isPending ||
              remaining < -0.001 ||
              hasOverMaxDraft,
          },
        ]}
      />

      <DeleteDialog
        open={draftToRemove != null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDraftToRemove(null);
          }
        }}
        title="Remove allocation"
        content={`Are you sure you want to remove the allocation for "${draftToRemove?.name}"?`}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setDraftToRemove(null),
          },
          {
            buttonContent: "Remove",
            variant: "danger",
            clicked: confirmRemoveDraft,
          },
        ]}
      />
    </>
  );
}
