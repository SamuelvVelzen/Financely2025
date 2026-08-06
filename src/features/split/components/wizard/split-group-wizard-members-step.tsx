import type { ISplitGroupMember } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitGroupMembersStep } from "@/features/split/components/split-group-members-step";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";

export interface ISplitGroupWizardMembersStepProps {
  groupId: string;
  groupName: string;
  guestAccessToken?: string;
  members: ISplitGroupMember[];
  currentMemberId: string;
  currentMemberRole: string;
}

export function SplitGroupWizardMembersStep({
  groupId,
  groupName,
  guestAccessToken,
  members,
  currentMemberId,
  currentMemberRole,
}: ISplitGroupWizardMembersStepProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <Title className="text-3xl mb-4">Invite people</Title>
        <Text
          size="lg"
          isMuted
          className="max-w-md mx-auto">
          Add members now or skip and invite them later from the group page.
        </Text>
      </div>
      <SplitGroupMembersStep
        groupId={groupId}
        groupName={groupName}
        guestAccessToken={guestAccessToken}
        members={members}
        currentMemberId={currentMemberId}
        currentMemberRole={currentMemberRole}
      />
    </div>
  );
}
