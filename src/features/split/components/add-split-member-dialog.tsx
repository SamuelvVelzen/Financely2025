import { useAddSplitMember } from "@/features/split/hooks/use-split-groups";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { Button } from "@/features/ui/button/button";
import { TextInput } from "@/features/ui/input/text-input";
import { BaseInput } from "@/features/ui/input/input";
import { useToast } from "@/features/ui/toast";
import { useState } from "react";

function AddSplitMemberForm({
  groupId,
  onClose,
}: {
  groupId: string;
  onClose: () => void;
}) {
  const addMember = useAddSplitMember(groupId);
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async () => {
    try {
      await addMember.mutateAsync({
        email: email.trim(),
        displayName: displayName.trim() || undefined,
      });
      toast.success("Person added to the group");
      onClose();
    } catch {
      toast.error("Could not add person. They may already be in the group.");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <BaseInput
        label="Email"
        type="email"
        value={email}
        onChange={(v) => setEmail(String(v ?? ""))}
        placeholder="friend@example.com"
      />
      <TextInput
        label="Name (optional)"
        value={displayName}
        onChange={(v) => setDisplayName(String(v ?? ""))}
        placeholder="Alex"
      />
      <Button
        variant="primary"
        clicked={() => void handleSubmit()}
        disabled={!email.trim() || addMember.isPending}
        className="w-full">
        Add person
      </Button>
    </div>
  );
}

export function AddSplitMemberDialog({
  open,
  onOpenChange,
  groupId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}) {
  const { isMobile } = useResponsive();

  const form = open ? (
    <AddSplitMemberForm groupId={groupId} onClose={() => onOpenChange(false)} />
  ) : null;

  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} title="Add person">
        {form}
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Add person" content={form} />
  );
}
