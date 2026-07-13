import type { ICreateSplitSettlementInput } from "@/features/shared/validation/schemas";
import { useCreateSplitSettlement } from "@/features/split/hooks/use-split-groups";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { Button } from "@/features/ui/button/button";
import { TextInput } from "@/features/ui/input/text-input";
import { Select } from "@/features/ui/select/select";
import { useState } from "react";

type IMember = { id: string; displayName: string };

export function RecordSettlementDialog({
  open,
  onOpenChange,
  groupId,
  members,
  currency,
  currentMemberId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  members: IMember[];
  currency: string;
  currentMemberId: string;
}) {
  const { isMobile } = useResponsive();
  const createSettlement = useCreateSplitSettlement(groupId);
  const [fromMemberId, setFromMemberId] = useState(currentMemberId);
  const [toMemberId, setToMemberId] = useState(
    members.find((m) => m.id !== currentMemberId)?.id ?? currentMemberId,
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const memberOptions = members.map((m) => ({
    value: m.id,
    label: m.displayName,
  }));

  const handleSubmit = async () => {
    const input: ICreateSplitSettlementInput = {
      fromMemberId,
      toMemberId,
      amount,
      settledAt: new Date().toISOString(),
      note: note || undefined,
    };
    await createSettlement.mutateAsync(input);
    setAmount("");
    setNote("");
    onOpenChange(false);
  };

  const form = (
    <div className="space-y-4 p-4">
      <Select
        label="From"
        value={fromMemberId}
        onChange={(v) =>
          setFromMemberId(typeof v === "string" ? v : currentMemberId)
        }
        options={memberOptions}
      />
      <Select
        label="To"
        value={toMemberId}
        onChange={(v) =>
          setToMemberId(typeof v === "string" ? v : currentMemberId)
        }
        options={memberOptions}
      />
      <TextInput
        label={`Amount (${currency})`}
        value={amount}
        onChange={(v) => setAmount(String(v ?? ""))}
      />
      <TextInput
        label="Note (optional)"
        value={note}
        onChange={(v) => setNote(String(v ?? ""))}
      />
      <Button
        variant="primary"
        clicked={() => void handleSubmit()}
        disabled={!amount || fromMemberId === toMemberId || createSettlement.isPending}
        className="w-full">
        Record payment
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} title="Settle up">
        {form}
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Settle up" content={form} />
  );
}
