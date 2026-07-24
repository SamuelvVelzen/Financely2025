import { SplitSectionCard } from "@/features/split/components/split-section-card";
import { useAddSplitMember } from "@/features/split/hooks/use-split-groups";
import { Button } from "@/features/ui/button/button";
import { BaseInput } from "@/features/ui/input/input";
import { TextInput } from "@/features/ui/input/text-input";
import { useToast } from "@/features/ui/toast";
import { HiEnvelope, HiUserPlus } from "react-icons/hi2";
import { useState } from "react";

export function SplitGroupInviteByEmailForm({ groupId }: { groupId: string }) {
  const addMember = useAddSplitMember(groupId);
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleAddMember = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return;
    }

    try {
      await addMember.mutateAsync({
        email: trimmedEmail,
        displayName: displayName.trim() || undefined,
      });
      toast.success("Person added to the group");
      setEmail("");
      setDisplayName("");
    } catch {
      toast.error("Could not add person. They may already be in the group.");
    }
  };

  return (
    <SplitSectionCard
      variant="default"
      icon={<HiEnvelope className="size-5" />}
      title="Invite by email"
      description="Add Financely users directly. If they do not have an account yet, they will join automatically when they sign up.">
      <div className="space-y-4">
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
      </div>

      <Button
        variant="primary"
        clicked={() => void handleAddMember()}
        disabled={!email.trim() || addMember.isPending}
        className="w-full"
        loading={{
          isLoading: addMember.isPending,
          text: "Adding person",
        }}>
        <HiUserPlus className="size-4" />
        Add to group
      </Button>
    </SplitSectionCard>
  );
}
