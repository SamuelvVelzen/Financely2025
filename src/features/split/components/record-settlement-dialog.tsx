import type { ICreateSplitSettlementInput } from "@/features/shared/validation/schemas";
import { createGuestSplitSettlement } from "@/features/split/api/guest-client";
import { useCreateSplitSettlement } from "@/features/split/hooks/use-split-groups";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { useFinMutation } from "@/features/shared/query/core";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { Button } from "@/features/ui/button/button";
import { DecimalInput } from "@/features/ui/input/decimal-input";
import { TextInput } from "@/features/ui/input/text-input";
import { Select } from "@/features/ui/select/select";
import { useToast } from "@/features/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type IMember = { id: string; displayName: string };
type ISettlementDirection = "paid" | "received";

function getOtherMembers(members: IMember[], currentMemberId: string) {
  return members.filter((member) => member.id !== currentMemberId);
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  guestToken?: string;
  members: IMember[];
  currency: string;
  currentMemberId: string;
  isAdmin?: boolean;
}) {
  const { isMobile } = useResponsive();
  const toast = useToast();
  const queryClient = useQueryClient();
  const createAuthSettlement = useCreateSplitSettlement(groupId ?? "");
  const otherMembers = useMemo(
    () => getOtherMembers(members, currentMemberId),
    [members, currentMemberId],
  );
  const [direction, setDirection] = useState<ISettlementDirection>("paid");
  const [otherMemberId, setOtherMemberId] = useState(
    otherMembers[0]?.id ?? "",
  );
  const [fromMemberId, setFromMemberId] = useState(currentMemberId);
  const [toMemberId, setToMemberId] = useState(otherMembers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const createGuestSettlement = useFinMutation({
    mutationFn: (input: ICreateSplitSettlementInput) =>
      createGuestSplitSettlement(guestToken!, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["split-guest", guestToken] });
    },
  });

  const isPending = guestToken
    ? createGuestSettlement.isPending
    : createAuthSettlement.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const firstOther = otherMembers[0]?.id ?? "";
      setDirection("paid");
      setOtherMemberId(firstOther);
      setFromMemberId(currentMemberId);
      setToMemberId(firstOther);
      setAmount("");
      setNote("");
    }
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
    !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    const input: ICreateSplitSettlementInput = {
      fromMemberId: resolvedFromMemberId,
      toMemberId: resolvedToMemberId,
      amount,
      settledAt: new Date().toISOString(),
      note: note || undefined,
    };

    try {
      if (guestToken) {
        await createGuestSettlement.mutateAsync(input);
      } else if (groupId) {
        await createAuthSettlement.mutateAsync(input);
      }
      toast.success("Settlement recorded");
      handleOpenChange(false);
    } catch {
      toast.error("Could not record settlement");
    }
  };

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
        label={`Amount (${currency})`}
        value={amount}
        onChange={(value) => setAmount(String(value ?? ""))}
      />
      <TextInput
        label="Note (optional)"
        value={note}
        onChange={(value) => setNote(String(value ?? ""))}
      />
      <Button
        variant="primary"
        clicked={() => void handleSubmit()}
        disabled={!canSubmit}
        loading={
          isPending
            ? { isLoading: true, text: "Recording payment" }
            : undefined
        }
        className="w-full">
        Record payment
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={handleOpenChange} title="Settle up">
        {form}
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} title="Settle up" content={form} />
  );
}
