import type { ISplitGroupMember } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitGroupInviteByEmailForm } from "@/features/split/components/split-group-invite-by-email-form";
import { SplitGroupMemberList } from "@/features/split/components/split-group-member-list";
import { SplitGroupShareLink } from "@/features/split/components/split-group-share-link";
import { useRemoveSplitMember } from "@/features/split/hooks/use-split-groups";
import { Badge } from "@/features/ui/badge/badge";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { useToast } from "@/features/ui/toast";
import { HiUsers } from "react-icons/hi2";
import { useState } from "react";

export function SplitGroupMembersStep({
  groupId,
  groupName,
  guestAccessToken,
  members,
  currentMemberId,
  currentMemberRole,
}: {
  groupId: string;
  groupName: string;
  guestAccessToken?: string;
  members: ISplitGroupMember[];
  currentMemberId: string;
  currentMemberRole: string;
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

  const memberLabel = members.length === 1 ? "person" : "people";

  return (
    <div className="pb-2">
      <p className="mb-6 text-sm leading-relaxed text-text-muted">
        Invite people to{" "}
        <span className="font-medium text-text">{groupName}</span>. You can
        always add more later from the group page.
      </p>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        <section className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <HiUsers className="size-5 shrink-0 text-text-muted" />
              <h3 className="text-base font-semibold text-text">In this group</h3>
            </div>
            <Badge variant="default">
              {members.length} {memberLabel}
            </Badge>
          </div>
          <SplitGroupMemberList
            members={members}
            currentMemberId={currentMemberId}
            currentMemberRole={currentMemberRole}
            onRemove={setRemovingMember}
          />
        </section>

        <aside className="min-w-0 flex-1 space-y-5">
          <SplitGroupInviteByEmailForm groupId={groupId} />
          {guestAccessToken ? (
            <SplitGroupShareLink
              groupId={groupId}
              guestAccessToken={guestAccessToken}
              groupName={groupName}
            />
          ) : null}
        </aside>
      </div>

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
    </div>
  );
}
