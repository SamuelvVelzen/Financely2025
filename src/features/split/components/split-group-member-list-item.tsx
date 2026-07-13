import {
  canRemoveSplitMember,
  getMemberStatusLabel,
  type ISplitGroupMember,
} from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { Avatar } from "@/features/ui/avatar/avatar";
import { Badge } from "@/features/ui/badge/badge";
import { IconButton } from "@/features/ui/button/icon-button";
import { ListItem } from "@/features/ui/list/list-item";
import { HiTrash } from "react-icons/hi2";

export function SplitGroupMemberListItem({
  member,
  currentMemberId,
  currentMemberRole,
  onRemove,
}: {
  member: ISplitGroupMember;
  currentMemberId: string;
  currentMemberRole: string;
  onRemove: (member: ISplitGroupMember) => void;
}) {
  const isCurrentUser = member.id === currentMemberId;
  const statusLabel = getMemberStatusLabel(member.status);
  const canRemove = canRemoveSplitMember({
    member,
    currentMemberId,
    currentMemberRole,
  });

  return (
    <ListItem className="gap-4 py-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Avatar displayName={member.displayName} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-text truncate">
              {member.displayName}
            </p>
            {isCurrentUser ? <Badge variant="primary">You</Badge> : null}
            {!isCurrentUser && statusLabel ? (
              <Badge variant={member.status === "pending" ? "warning" : "info"}>
                {statusLabel}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
      {canRemove ? (
        <IconButton
          size="sm"
          ariaLabel={`Remove ${member.displayName}`}
          clicked={() => onRemove(member)}
          className="text-danger shrink-0">
          <HiTrash className="size-4" />
        </IconButton>
      ) : null}
    </ListItem>
  );
}
