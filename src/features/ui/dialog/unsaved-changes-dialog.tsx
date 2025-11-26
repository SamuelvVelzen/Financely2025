"use client";

import { Dialog } from "./dialog/dialog";
import type { IDialogProps } from "./dialog/types";

type UnsavedChangesDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: IDialogProps["title"];
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function UnsavedChangesDialog({
  open,
  onConfirm,
  onCancel,
  title = "Unsaved changes",
  description = "You have unsaved changes. If you leave now, those changes will be lost.",
  confirmLabel = "Discard changes",
  cancelLabel = "Keep editing",
}: UnsavedChangesDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onCancel();
        }
      }}
      dismissible={false}
      variant="modal"
      size="sm"
      title={title}
      content={
        typeof description === "string" ? (
          <p className="text-sm text-text-muted">{description}</p>
        ) : (
          description
        )
      }
      footerButtons={[
        {
          buttonContent: cancelLabel,
          variant: "default",
          clicked: onCancel,
        },
        {
          buttonContent: confirmLabel,
          variant: "danger",
          clicked: onConfirm,
        },
      ]}
    />
  );
}
