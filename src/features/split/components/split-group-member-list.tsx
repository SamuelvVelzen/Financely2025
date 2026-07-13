import type { ISplitGroupMember } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitGroupMemberListItem } from "@/features/split/components/split-group-member-list-item";
import { List } from "@/features/ui/list/list";

export function SplitGroupMemberList({
  members,
  currentMemberId,
  currentMemberRole,
  onRemove,
}: {
  members: ISplitGroupMember[];
  currentMemberId: string;
  currentMemberRole: string;
  onRemove: (member: ISplitGroupMember) => void;
}) {
  if (members.length === 0) {
    return null;
  }

  return (
    <List data={members}>
      {(member) => (
        <SplitGroupMemberListItem
          member={member}
          currentMemberId={currentMemberId}
          currentMemberRole={currentMemberRole}
          onRemove={onRemove}
        />
      )}
    </List>
  );
}
