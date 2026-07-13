import { AddOrEditSplitGroupDialogContent } from "@/features/split/components/add-or-edit-split-group-dialog-content";
import type { IAddOrEditSplitGroupDialogProps } from "@/features/split/components/add-or-edit-split-group-dialog-shared";

export type { IAddOrEditSplitGroupDialogProps, ISplitGroupDialogTarget, ISplitGroupWizardStep } from "@/features/split/components/add-or-edit-split-group-dialog-shared";

export function AddOrEditSplitGroupDialog(props: IAddOrEditSplitGroupDialogProps) {
  const sessionKey = props.open
    ? `${props.group?.id ?? props.defaultCurrency}-${props.initialStep ?? "details"}`
    : "closed";

  return <AddOrEditSplitGroupDialogContent key={sessionKey} {...props} />;
}
