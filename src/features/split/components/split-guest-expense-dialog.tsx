import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { createGuestSplitExpense } from "@/features/split/api/guest-client";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { SplitExpenseForm } from "@/features/split/components/split-expense-form";
import {
  getEmptySplitExpenseFormValues,
  getExactSharesForSubmit,
  type ISplitExpenseFormValues,
} from "@/features/split/utils/split-expense-form-values";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { useFinMutation } from "@/features/shared/query/core";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { useToast } from "@/features/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useId } from "react";

type IMember = { id: string; displayName: string };

export function SplitGuestExpenseDialog({
  open,
  onOpenChange,
  token,
  groupCurrency,
  expenses,
  members,
  currentMemberId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  groupCurrency: string;
  expenses: ISplitExpense[];
  members: IMember[];
  currentMemberId: string;
}) {
  const { isMobile } = useResponsive();
  const toast = useToast();
  const formId = useId();
  const queryClient = useQueryClient();
  const createExpense = useFinMutation({
    mutationFn: (input: ISplitExpenseFormValues) =>
      createGuestSplitExpense(token, {
        description: input.description.trim(),
        amount: input.amount.trim(),
        currency: input.currency,
        expenseDate: input.expenseDate,
        paidByMemberId: input.paidByMemberId,
        participantMemberIds: input.participantMemberIds,
        splitMode: input.splitMode,
        exactShares: getExactSharesForSubmit(input),
        clientMutationId: crypto.randomUUID(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["split-guest", token] });
    },
  });

  const initialValues = getEmptySplitExpenseFormValues(
    groupCurrency,
    currentMemberId,
    members.map((member) => member.id),
  );

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (values: ISplitExpenseFormValues) => {
    try {
      const created = await createExpense.mutateAsync(values);
      if (!isOfflineMutationPlaceholder(created)) {
        toast.success("Expense added");
      }
      handleClose();
    } catch {
      toast.error("Could not add expense");
    }
  };

  const form = open ? (
    <SplitExpenseForm
      formId={formId}
      initialValues={initialValues}
      groupCurrency={groupCurrency}
      expenses={expenses}
      members={members}
      disabled={createExpense.isPending}
      onSubmit={(values) => void handleSubmit(values)}
    />
  ) : null;

  const footerButtons = [
    {
      clicked: handleClose,
      disabled: createExpense.isPending,
      buttonContent: "Cancel",
    },
    {
      variant: "primary" as const,
      type: "submit" as const,
      form: formId,
      disabled: createExpense.isPending,
      loading: {
        isLoading: createExpense.isPending,
        text: "Adding expense",
      },
      buttonContent: "Add expense",
    },
  ];

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleClose();
            return;
          }
          onOpenChange(true);
        }}
        title="Add expense"
        footerButtons={footerButtons}>
        {form}
      </BottomSheet>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
          return;
        }
        onOpenChange(true);
      }}
      title="Add expense"
      content={form}
      footerButtons={footerButtons}
      dismissible={!createExpense.isPending}
    />
  );
}
