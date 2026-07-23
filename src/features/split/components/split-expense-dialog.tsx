import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  useCreateSplitExpense,
  useUpdateSplitExpense,
} from "@/features/split/hooks/use-split-groups";
import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { SplitExpenseForm } from "@/features/split/components/split-expense-form";
import {
  getEmptySplitExpenseFormValues,
  getExactSharesForSubmit,
  getFormValuesForAnotherExpense,
  getSplitExpenseFormValuesFromExpense,
  type ISplitExpenseFormValues,
} from "@/features/split/utils/split-expense-form-values";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { useToast } from "@/features/ui/toast";
import { useId, useMemo, useRef, useState } from "react";

type IMember = { id: string; displayName: string };

export function SplitExpenseDialog({
  open,
  onOpenChange,
  groupId,
  groupCurrency,
  expenses,
  members,
  currentMemberId,
  expense,
  onSwitchToCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupCurrency: string;
  expenses: ISplitExpense[];
  members: IMember[];
  currentMemberId: string;
  expense?: ISplitExpense;
  onSwitchToCreate?: () => void;
}) {
  const { isMobile } = useResponsive();
  const toast = useToast();
  const formId = useId();
  const afterSuccessRef = useRef<"close" | "addAnother">("close");
  const isEditMode = expense != null;
  const createExpense = useCreateSplitExpense(groupId);
  const updateExpense = useUpdateSplitExpense(groupId);
  const [pendingAction, setPendingAction] = useState<"close" | "addAnother" | null>(
    null,
  );
  const [createSession, setCreateSession] = useState(0);
  const [carryOverValues, setCarryOverValues] =
    useState<ISplitExpenseFormValues | null>(null);

  const memberIds = useMemo(() => members.map((member) => member.id), [members]);

  const initialValues = useMemo(() => {
    if (expense) {
      return getSplitExpenseFormValuesFromExpense(expense);
    }
    if (carryOverValues) {
      return carryOverValues;
    }
    return getEmptySplitExpenseFormValues(
      groupCurrency,
      currentMemberId,
      memberIds,
    );
  }, [
    expense,
    carryOverValues,
    groupCurrency,
    currentMemberId,
    memberIds,
  ]);

  const formKey = expense?.id ?? `create-${createSession}`;
  const isPending = createExpense.isPending || updateExpense.isPending;

  const handleClose = () => {
    setCarryOverValues(null);
    setPendingAction(null);
    afterSuccessRef.current = "close";
    onOpenChange(false);
  };

  const requestFormSubmit = (afterSuccess: "close" | "addAnother") => {
    afterSuccessRef.current = afterSuccess;
    const formElement = document.getElementById(formId);
    if (formElement instanceof HTMLFormElement) {
      formElement.requestSubmit();
    }
  };

  const handleSubmit = async (values: ISplitExpenseFormValues) => {
    const afterSuccess = afterSuccessRef.current;
    setPendingAction(afterSuccess);
    afterSuccessRef.current = "close";

    try {
      if (isEditMode && expense) {
        const updated = await updateExpense.mutateAsync({
          expenseId: expense.id,
          input: {
            description: values.description.trim(),
            amount: values.amount.trim(),
            currency: values.currency,
            expenseDate: values.expenseDate,
            paidByMemberId: values.paidByMemberId,
            participantMemberIds: values.participantMemberIds,
            splitMode: values.splitMode,
            exactShares: getExactSharesForSubmit(values),
          },
        });
        if (!isOfflineMutationPlaceholder(updated)) {
          toast.success("Expense updated");
        }

        if (afterSuccess === "addAnother") {
          setCarryOverValues(
            getFormValuesForAnotherExpense(values, groupCurrency, memberIds),
          );
          onSwitchToCreate?.();
          setCreateSession((session) => session + 1);
          setPendingAction(null);
          return;
        }

        handleClose();
        return;
      }

      const created = await createExpense.mutateAsync({
        description: values.description.trim(),
        amount: values.amount.trim(),
        currency: values.currency,
        expenseDate: values.expenseDate,
        paidByMemberId: values.paidByMemberId,
        participantMemberIds: values.participantMemberIds,
        splitMode: values.splitMode,
        exactShares: getExactSharesForSubmit(values),
        clientMutationId: crypto.randomUUID(),
      });

      if (!isOfflineMutationPlaceholder(created)) {
        toast.success("Expense added");
      }

      if (afterSuccess === "addAnother") {
        setCarryOverValues(
          getFormValuesForAnotherExpense(values, groupCurrency, memberIds),
        );
        setCreateSession((session) => session + 1);
        setPendingAction(null);
        return;
      }

      handleClose();
    } catch {
      toast.error(
        isEditMode ? "Could not update expense" : "Could not add expense",
      );
      setPendingAction(null);
    }
  };

  const title = isEditMode ? "Edit expense" : "Add expense";
  const form = open ? (
    <SplitExpenseForm
      key={formKey}
      formId={formId}
      initialValues={initialValues}
      groupCurrency={groupCurrency}
      expenses={expenses}
      members={members}
      disabled={isPending}
      onSubmit={(values) => void handleSubmit(values)}
    />
  ) : null;

  const footerButtons = [
    {
      clicked: handleClose,
      disabled: isPending,
      buttonContent: "Cancel",
    },
    {
      clicked: () => requestFormSubmit("addAnother"),
      disabled: isPending,
      loading: {
        isLoading: pendingAction === "addAnother",
        text: isEditMode ? "Saving expense" : "Adding expense",
      },
      buttonContent: isEditMode ? "Save & add another" : "Add & add another",
    },
    {
      variant: "primary" as const,
      type: "submit" as const,
      form: formId,
      disabled: isPending,
      loading: {
        isLoading: pendingAction === "close",
        text: isEditMode ? "Saving expense" : "Adding expense",
      },
      buttonContent: isEditMode ? "Save" : "Add expense",
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
        title={title}
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
      title={title}
      content={form}
      footerButtons={footerButtons}
      dismissible={!isPending}
    />
  );
}
