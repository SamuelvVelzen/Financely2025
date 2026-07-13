export type ISplitGroupWizardStep = "details" | "members";

export type ISplitGroupMember = {
  id: string;
  displayName: string;
  status?: string;
  role?: string;
};

export type ISplitGroupDialogTarget = {
  id: string;
  name: string;
  defaultCurrency: string;
  expenseCount: number;
  guestAccessToken?: string;
  members?: ISplitGroupMember[];
  currentMemberId?: string;
  currentMemberRole?: string;
};

export type IAddOrEditSplitGroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: ISplitGroupDialogTarget;
  defaultCurrency: string;
  initialStep?: ISplitGroupWizardStep;
  onSuccess?: () => void;
};

export type ISplitGroupFormValues = {
  name: string;
  defaultCurrency: string;
};

export function getEmptySplitGroupFormValues(
  defaultCurrency: string,
): ISplitGroupFormValues {
  return {
    name: "",
    defaultCurrency,
  };
}

export function getSplitGroupFormValuesFromGroup(
  group: ISplitGroupDialogTarget,
): ISplitGroupFormValues {
  return {
    name: group.name,
    defaultCurrency: group.defaultCurrency,
  };
}

export function getMemberStatusLabel(status?: string): string | null {
  if (status === "pending") {
    return "Invited";
  }
  if (status === "guest") {
    return "Guest";
  }
  return null;
}

export function canRemoveSplitMember({
  member,
  currentMemberId,
  currentMemberRole,
}: {
  member: ISplitGroupMember;
  currentMemberId: string;
  currentMemberRole: string;
}): boolean {
  if (member.id === currentMemberId) {
    return true;
  }
  return currentMemberRole === "admin";
}
