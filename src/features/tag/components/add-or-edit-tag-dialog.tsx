import { AddOrEditTagDialogContent } from "@/features/tag/components/add-or-edit-tag-dialog-content";
import type { IAddOrEditTagDialogProps } from "@/features/tag/components/add-or-edit-tag-dialog-shared";

export type { IAddOrEditTagDialogProps } from "@/features/tag/components/add-or-edit-tag-dialog-shared";

export function AddOrEditTagDialog(props: IAddOrEditTagDialogProps) {
  const sessionKey = props.open
    ? (props.tag?.id ?? props.initialName ?? "create")
    : "closed";

  return (
    <AddOrEditTagDialogContent
      key={sessionKey}
      {...props}
    />
  );
}
