import type { ICreateSplitSettlementInput } from "@/features/shared/validation/schemas";
import { createGuestSplitSettlement } from "@/features/split/api/guest-client";
import {
  useCreateSplitSettlement,
  useUpdateSplitSettlement,
} from "@/features/split/hooks/use-split-groups";
import type { ISplitSettlement } from "@/features/split/utils/group-split-settlements-by-date";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { useFinMutation } from "@/features/shared/query/core";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { DateInput } from "@/features/ui/input/date-input";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { Textarea } from "@/features/ui/input/textarea";
import { Select } from "@/features/ui/select/select";
import { useToast } from "@/features/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type IMember = { id: string; displayName: string };
type ISettlementDirection = "paid" | "received";

function getOtherMembers(members: IMember[], currentMemberId: string) {
  return members.filter((member) => member.id !== currentMemberId);
}

function getDirectionFromSettlement(
  settlement: ISplitSettlement,
  currentMemberId: string,
): ISettlementDirection {
  return settlement.fromMemberId === currentMemberId ? "paid" : "received";
}

function getOtherMemberIdFromSettlement(
  settlement: ISplitSettlement,
  currentMemberId: string,
) {
  return settlement.fromMemberId === currentMemberId
    ? settlement.toMemberId
    : settlement.fromMemberId;
}

function getCreateFormState(
  members: IMember[],
  currentMemberId: string,
) {
  const otherMembers = getOtherMembers(members, currentMemberId);
  const firstOther = otherMembers[0]?.id ?? "";

  return {
    direction: "paid" as const,
    otherMemberId: firstOther,
    fromMemberId: currentMemberId,
    toMemberId: firstOther,
    amount: "",
    note: "",
    settledAt: new Date().toISOString(),
  };
}

function getEditFormState(
  settlement: ISplitSettlement,
  currentMemberId: string,
) {
  return {
    direction: getDirectionFromSettlement(settlement, currentMemberId),
    otherMemberId: getOtherMemberIdFromSettlement(settlement, currentMemberId),
    fromMemberId: settlement.fromMemberId,
    toMemberId: settlement.toMemberId,
    amount: settlement.amount,
    note: settlement.note ?? "",
    settledAt: settlement.settledAt,
  };
}

export function RecordSettlementDialog({
  open,
  onOpenChange,
  groupId,
  guestToken,
  members,
  currency,
  currentMemberId,
  isAdmin = false,
  settlement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  guestToken?: string;
  members: IMember[];
  currency: string;
  currentMemberId: string;
  isAdmin?: boolean;
  settlement?: ISplitSettlement;
}) {
  const { isMobile } = useResponsive();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEditMode = settlement != null;
  const createAuthSettlement = useCreateSplitSettlement(groupId ?? "");
  const updateAuthSettlement = useUpdateSplitSettlement(groupId ?? "");
  const otherMembers = useMemo(
    () => getOtherMembers(members, currentMemberId),
    [members, currentMemberId],
  );
  const initialFormState = settlement
    ? getEditFormState(settlement, currentMemberId)
    : getCreateFormState(members, currentMemberId);
  const [direction, setDirection] = useState(initialFormState.direction);
  const [otherMemberId, setOtherMemberId] = useState(
    initialFormState.otherMemberId,
  );
  const [fromMemberId, setFromMemberId] = useState(initialFormState.fromMemberId);
  const [toMemberId, setToMemberId] = useState(initialFormState.toMemberId);
  const [amount, setAmount] = useState(initialFormState.amount);
  const [note, setNote] = useState(initialFormState.note);
  const [settledAt, setSettledAt] = useState(initialFormState.settledAt);

  const createGuestSettlement = useFinMutation({
    mutationFn: (input: ICreateSplitSettlementInput) =>
      createGuestSplitSettlement(guestToken!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["split-guest", guestToken] });
    },
  });

  const isPending = guestToken
    ? createGuestSettlement.isPending
    : isEditMode
      ? updateAuthSettlement.isPending
      : createAuthSettlement.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const directionOptions = [
    { value: "paid" as const, label: "I paid someone" },
    { value: "received" as const, label: "Someone paid me" },
  ];

  const otherMemberOptions = otherMembers.map((member) => ({
    value: member.id,
    label: member.displayName,
  }));

  const fromOptions = members
    .filter((member) => member.id !== toMemberId)
    .map((member) => ({
      value: member.id,
      label: member.displayName,
    }));

  const toOptions = members
    .filter((member) => member.id !== fromMemberId)
    .map((member) => ({
      value: member.id,
      label: member.displayName,
    }));

  const resolvedFromMemberId = isAdmin
    ? fromMemberId
    : direction === "paid"
      ? currentMemberId
      : otherMemberId;

  const resolvedToMemberId = isAdmin
    ? toMemberId
    : direction === "paid"
      ? otherMemberId
      : currentMemberId;

  const canSubmit =
    Boolean(amount) &&
    Boolean(resolvedFromMemberId) &&
    Boolean(resolvedToMemberId) &&
    resolvedFromMemberId !== resolvedToMemberId &&
    Boolean(settledAt) &&
    !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    try {
      if (isEditMode && settlement && groupId) {
        await updateAuthSettlement.mutateAsync({
          settlementId: settlement.id,
          input: {
            fromMemberId: resolvedFromMemberId,
            toMemberId: resolvedToMemberId,
            amount,
            settledAt,
            note: note || null,
          },
        });
        toast.success("Settlement updated");
      } else {
        const input: ICreateSplitSettlementInput = {
          fromMemberId: resolvedFromMemberId,
          toMemberId: resolvedToMemberId,
          amount,
          settledAt,
          note: note || undefined,
        };

        if (guestToken) {
          await createGuestSettlement.mutateAsync(input);
        } else if (groupId) {
          await createAuthSettlement.mutateAsync(input);
        }
        toast.success("Settlement recorded");
      }
      handleOpenChange(false);
    } catch {
      toast.error(
        isEditMode
          ? "Could not update settlement"
          : "Could not record settlement",
      );
    }
  };

  const title = isEditMode ? "Edit settlement" : "Settle up";
  const submitLabel = isEditMode ? "Save changes" : "Record payment";
  const pendingLabel = isEditMode ? "Saving changes" : "Recording payment";

  const form = (
    <div className="space-y-4 p-4">
      {isAdmin ? (
        <>
          <Select
            label="From"
            value={fromMemberId}
            onChange={(value) => {
              const nextFrom =
                typeof value === "string" ? value : currentMemberId;
              setFromMemberId(nextFrom);
              if (nextFrom === toMemberId) {
                const fallback = members.find((member) => member.id !== nextFrom);
                setToMemberId(fallback?.id ?? "");
              }
            }}
            options={fromOptions}
          />
          <Select
            label="To"
            value={toMemberId}
            onChange={(value) => {
              const nextTo = typeof value === "string" ? value : currentMemberId;
              setToMemberId(nextTo);
              if (nextTo === fromMemberId) {
                const fallback = members.find((member) => member.id !== nextTo);
                setFromMemberId(fallback?.id ?? "");
              }
            }}
            options={toOptions}
          />
        </>
      ) : (
        <>
          <Select
            label="Payment type"
            value={direction}
            onChange={(value) => {
              if (value === "paid" || value === "received") {
                setDirection(value);
              }
            }}
            options={directionOptions}
          />
          <Select
            label={direction === "paid" ? "Who did you pay?" : "Who paid you?"}
            value={otherMemberId}
            onChange={(value) => {
              if (typeof value === "string") {
                setOtherMemberId(value);
              }
            }}
            options={otherMemberOptions}
          />
        </>
      )}
      <DecimalInput
        label="Amount"
        value={amount}
        onChange={(value) => setAmount(String(value ?? ""))}
        currency={currency}
      />
      {isEditMode ? (
        <DateInput
          label="Date"
          mode="dateTime"
          value={settledAt}
          onChange={(value) => setSettledAt(String(value ?? ""))}
        />
      ) : null}
      <Textarea
        label="Note (optional)"
        value={note}
        onChange={(value) => setNote(String(value ?? ""))}
        rows={3}
      />
    </div>
  );

  const footerButtons = [
    {
      buttonContent: "Cancel",
      clicked: () => handleOpenChange(false),
      disabled: isPending,
    },
    {
      variant: "primary" as const,
      clicked: () => void handleSubmit(),
      disabled: !canSubmit,
      loading: isPending
        ? { isLoading: true, text: pendingLabel }
        : undefined,
      buttonContent: submitLabel,
    },
  ];

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={handleOpenChange}
        title={title}
        footerButtons={footerButtons}>
        {form}
      </BottomSheet>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      content={form}
      footerButtons={footerButtons}
    />
  );
}
