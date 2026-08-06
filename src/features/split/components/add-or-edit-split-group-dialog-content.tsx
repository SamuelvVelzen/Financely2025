import {
  getEmptySplitGroupFormValues,
  getSplitGroupFormValuesFromGroup,
  type IAddOrEditSplitGroupDialogProps,
  type ISplitGroupFormValues,
  type ISplitGroupWizardStep,
} from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitGroupDetailsForm } from "@/features/split/components/split-group-details-form";
import { SplitGroupMembersStep } from "@/features/split/components/split-group-members-step";
import {
  useCreateSplitGroup,
  useSplitGroup,
  useUpdateSplitGroup,
} from "@/features/split/hooks/use-split-groups";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { useToast } from "@/features/ui/toast";
import { useId, useState } from "react";

export function AddOrEditSplitGroupDialogContent({
  open,
  onOpenChange,
  group,
  defaultCurrency,
  initialStep = "details",
  onSuccess,
}: IAddOrEditSplitGroupDialogProps) {
  const { isMobile } = useResponsive();
  const toast = useToast();
  const formId = useId();
  const isEditMode = group != null;
  const [step, setStep] = useState<ISplitGroupWizardStep>(initialStep);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(
    group?.id ?? null,
  );
  const canChangeCurrency = !isEditMode || group.expenseCount === 0;
  const createGroup = useCreateSplitGroup();
  const updateGroup = useUpdateSplitGroup(activeGroupId ?? group?.id ?? "");
  const { data: liveGroup } = useSplitGroup(activeGroupId ?? group?.id ?? "");
  const isPending = createGroup.isPending || updateGroup.isPending;

  const resolvedGroup = liveGroup ?? group;
  const groupId = activeGroupId ?? group?.id ?? "";
  const groupName =
    (resolvedGroup?.name as string | undefined) ?? group?.name ?? "";
  const guestAccessToken =
    (resolvedGroup?.guestAccessToken as string | undefined) ??
    group?.guestAccessToken;
  const members =
    (resolvedGroup?.members as Array<{
      id: string;
      displayName: string;
      status?: string;
      role?: string;
    }>) ??
    group?.members ??
    [];
  const currentMemberId =
    (resolvedGroup?.currentMemberId as string | undefined) ??
    group?.currentMemberId ??
    "";
  const currentMemberRole =
    (resolvedGroup?.currentMemberRole as string | undefined) ??
    group?.currentMemberRole ??
    "member";

  const initialValues = group
    ? getSplitGroupFormValuesFromGroup(group)
    : getEmptySplitGroupFormValues(defaultCurrency);

  const handleClose = () => {
    onOpenChange(false);
  };

  const goToMembersStep = (nextGroupId: string) => {
    setActiveGroupId(nextGroupId);
    setStep("members");
  };

  const handleDetailsSubmit = async (values: ISplitGroupFormValues) => {
    try {
      if (isEditMode && group) {
        const hasChanges =
          values.name !== group.name.trim() ||
          (canChangeCurrency && values.defaultCurrency !== group.defaultCurrency);

        if (hasChanges) {
          await updateGroup.mutateAsync({
            name: values.name,
            ...(canChangeCurrency
              ? { defaultCurrency: values.defaultCurrency }
              : {}),
          });
          toast.success("Group updated");
        }

        goToMembersStep(group.id);
        return;
      }

      const created = await createGroup.mutateAsync({
        name: values.name,
        defaultCurrency: values.defaultCurrency,
      });
      if (isOfflineMutationPlaceholder(created)) {
        const offlineId =
          created &&
          typeof created === "object" &&
          "id" in created &&
          typeof (created as { id: unknown }).id === "string"
            ? (created as { id: string }).id
            : null;
        if (offlineId) {
          goToMembersStep(offlineId);
        } else {
          handleClose();
        }
        return;
      }
      toast.success("Group created");
      goToMembersStep(created.id as string);
    } catch {
      toast.error(
        isEditMode ? "Could not update group" : "Could not create group",
      );
    }
  };

  const handleDone = () => {
    const createdGroupId = !isEditMode && groupId ? groupId : undefined;
    handleClose();
    onSuccess?.(createdGroupId);
  };

  const detailsTitle = isEditMode ? "Edit group" : "New split group";
  const membersTitle = isEditMode ? "Manage people" : "Invite people";
  const title = step === "details" ? detailsTitle : membersTitle;

  const detailsForm =
    step === "details" && open ? (
      <SplitGroupDetailsForm
        formId={formId}
        initialValues={initialValues}
        canChangeCurrency={canChangeCurrency}
        isEditMode={isEditMode}
        disabled={isPending}
        onSubmit={(values) => void handleDetailsSubmit(values)}
      />
    ) : null;

  const membersStep =
    step === "members" && open && groupId ? (
      <SplitGroupMembersStep
        groupId={groupId}
        groupName={groupName}
        guestAccessToken={guestAccessToken}
        members={members}
        currentMemberId={currentMemberId}
        currentMemberRole={currentMemberRole}
      />
    ) : null;

  const footerButtons =
    step === "details"
      ? [
          {
            buttonContent: "Cancel",
            clicked: handleClose,
            disabled: isPending,
          },
          {
            variant: "primary" as const,
            type: "submit" as const,
            form: formId,
            disabled: isPending,
            loading: {
              isLoading: isPending,
              text: isEditMode ? "Saving group" : "Creating group",
            },
            buttonContent: isEditMode ? "Next" : "Create & invite",
          },
        ]
      : [
          {
            buttonContent: "Back",
            clicked: () => setStep("details"),
          },
          {
            variant: "primary" as const,
            clicked: handleDone,
            buttonContent: "Done",
          },
        ];

  const content = step === "details" ? detailsForm : membersStep;

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        footerButtons={footerButtons}>
        {content}
      </BottomSheet>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      content={content}
      footerButtons={footerButtons}
      dismissible={!isPending}
      size={step === "members" ? "3/4" : "lg"}
    />
  );
}
