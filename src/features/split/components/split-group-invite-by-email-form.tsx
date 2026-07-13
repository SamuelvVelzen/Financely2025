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
    <section className="rounded-2xl border border-border bg-surface/50 p-5 space-y-5">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
          <HiEnvelope className="size-5" />
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-base font-semibold text-text">Invite by email</h3>
          <p className="text-sm leading-relaxed text-text-muted mt-1.5">
            Add Financely users directly. If they do not have an account yet,
            they will join automatically when they sign up.
          </p>
        </div>
      </div>

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
    </section>
  );
}
