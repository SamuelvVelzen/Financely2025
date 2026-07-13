import {
  canRemoveSplitMember,
  getMemberStatusLabel,
  type ISplitGroupMember,
} from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { useRemoveSplitMember } from "@/features/split/hooks/use-split-groups";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { useToast } from "@/features/ui/toast";
import { HiPlus, HiTrash } from "react-icons/hi2";
import { useState } from "react";

export function SplitMembersSection({
  groupId,
  groupName,
  members,
  currentMemberId,
  currentMemberRole,
  onAddMember,
}: {
  groupId: string;
  groupName: string;
  members: ISplitGroupMember[];
  currentMemberId: string;
  currentMemberRole: string;
  onAddMember: () => void;
}) {
  const removeMember = useRemoveSplitMember(groupId);
  const toast = useToast();
  const [removingMember, setRemovingMember] = useState<ISplitGroupMember | null>(
    null,
  );

  const handleRemoveConfirm = () => {
    if (!removingMember) {
      return;
    }

    removeMember.mutate(removingMember.id, {
      onSuccess: () => {
        toast.success(`${removingMember.displayName} removed from the group`);
        setRemovingMember(null);
      },
      onError: () => {
        toast.error("Could not remove person from the group");
      },
    });
  };

  return (
    <Container className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-sm font-semibold text-text">People</h2>
        <Button variant="secondary" size="xs" clicked={onAddMember}>
          <HiPlus className="size-4" /> Add person
        </Button>
      </div>
      <ul className="space-y-2">
        {members.map((member) => {
          const statusLabel = getMemberStatusLabel(member.status);
          const canRemove = canRemoveSplitMember({
            member,
            currentMemberId,
            currentMemberRole,
          });

          return (
            <li
              key={member.id}
              className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <span className="text-text">{member.displayName}</span>
                {statusLabel ? (
                  <span className="ml-2 text-xs text-text-muted">
                    {statusLabel}
                  </span>
                ) : null}
              </div>
              {canRemove ? (
                <IconButton
                  size="xs"
                  ariaLabel={`Remove ${member.displayName}`}
                  clicked={() => setRemovingMember(member)}
                  className="text-danger">
                  <HiTrash className="size-4" />
                </IconButton>
              ) : null}
            </li>
          );
        })}
      </ul>

      <DeleteDialog
        open={removingMember != null}
        onOpenChange={(open) => {
          if (!open) {
            setRemovingMember(null);
          }
        }}
        title="Remove person"
        content={`Remove ${removingMember?.displayName} from "${groupName}"? They will no longer see this group.`}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setRemovingMember(null),
          },
          {
            buttonContent: "Remove",
            variant: "danger",
            clicked: handleRemoveConfirm,
            loading: {
              isLoading: removeMember.isPending,
              text: "Removing person",
            },
          },
        ]}
      />
    </Container>
  );
}
