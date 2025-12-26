"use client";

import {
  CreateTagInputSchema,
  type ITag,
  type ITransactionType,
} from "@/features/shared/validation/schemas";
import { useCreateTag, useUpdateTag } from "@/features/tag/hooks/useTags";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { ColorInput } from "@/features/ui/input/color-input";
import { TextInput } from "@/features/ui/input/text-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { useToast } from "@/features/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { z } from "zod";

type IAddOrCreateTagDialog = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: ITag;
  initialName?: string;
  onSuccess?: (createdTag?: ITag) => void;
};

type FormData = z.infer<typeof CreateTagInputSchema>;

const TRANSACTION_TYPE_OPTIONS = [
  { value: "EXPENSE", label: "Expense Only" },
  { value: "INCOME", label: "Income Only" },
  { value: "", label: "Both" },
] as const;

const getEmptyFormValues = (): FormData => ({
  name: "",
  color: "",
  description: "",
  transactionType: undefined,
});

export function AddOrCreateTagDialog({
  open,
  onOpenChange,
  tag,
  initialName,
  onSuccess,
}: IAddOrCreateTagDialog) {
  const [pending, setPending] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const isEditMode = !!tag;
  const { mutate: createTag } = useCreateTag();
  const { mutate: updateTag } = useUpdateTag();
  const toast = useToast();

  const form = useFinForm<FormData>({
    resolver: zodResolver(CreateTagInputSchema) as any,
    defaultValues: getEmptyFormValues(),
  });
  const hasUnsavedChanges = form.formState.isDirty;

  const resetFormToClosedState = () => {
    form.reset(getEmptyFormValues());
  };

  const closeDialog = () => {
    resetFormToClosedState();
    onOpenChange(false);
  };

  const handleAttemptClose = () => {
    if (pending) return;
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    closeDialog();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    handleAttemptClose();
  };

  // Reset form when dialog opens/closes or tag changes
  useEffect(() => {
    if (open) {
      if (tag) {
        // Edit mode: populate form with existing tag data
        form.reset({
          name: tag.name,
          color: tag.color ?? "",
          description: tag.description ?? "",
          transactionType: tag.transactionType ?? undefined,
        });
      } else {
        // Create mode: reset to defaults or use initial name
        form.reset({
          name: initialName || "",
          color: "",
          description: "",
          transactionType: undefined,
        });
      }
    } else {
      // Reset form when dialog closes to ensure clean state
      form.reset(getEmptyFormValues());
    }
  }, [open, tag?.id, initialName, form]);

  const handleSubmit = async (data: FormData) => {
    setPending(true);

    // Transform empty strings to null for optional fields
    const submitData = {
      name: data.name,
      color:
        data.color &&
        data.color.trim() !== "" &&
        /^#[0-9A-Fa-f]{6}$/.test(data.color.trim())
          ? data.color.trim()
          : null,
      description:
        data.description && data.description.trim() !== ""
          ? data.description.trim()
          : null,
      transactionType:
        data.transactionType && data.transactionType !== ""
          ? (data.transactionType as ITransactionType)
          : null,
    };

    try {
      if (isEditMode && tag) {
        // Update existing tag
        updateTag(
          { tagId: tag.id, input: submitData },
          {
            onSuccess: () => {
              resetFormToClosedState();
              setPending(false);
              onOpenChange(false);
              toast.success("Tag updated successfully");
              onSuccess?.();
            },
            onError: (error) => {
              setPending(false);
              toast.error("Failed to update tag");
              throw error;
            },
          }
        );
      } else {
        // Create new tag
        createTag(submitData, {
          onSuccess: (createdTag) => {
            resetFormToClosedState();
            setPending(false);
            onOpenChange(false);
            toast.success("Tag created successfully");
            onSuccess?.(createdTag);
          },
          onError: (error) => {
            setPending(false);
            toast.error("Failed to create tag");
            throw error;
          },
        });
      }
    } catch (err) {
      setPending(false);
      throw err; // Let Form component handle the error
    }
  };

  return (
    <>
      <Dialog
        title={isEditMode ? "Edit Tag" : "Create Tag"}
        content={
          <Form<FormData>
            form={form}
            onSubmit={handleSubmit}>
            <div className="space-y-4">
              <TextInput
                name="name"
                label="Name"
                disabled={pending}
                required
              />
              <ColorInput
                name="color"
                label="Color"
                disabled={pending}
              />
              <TextInput
                name="description"
                label="Description"
                disabled={pending}
              />
              <SelectDropdown
                name="transactionType"
                label="Transaction Type"
                options={TRANSACTION_TYPE_OPTIONS}
                placeholder="Select transaction type..."
                disabled={pending}
              />
            </div>
          </Form>
        }
        footerButtons={[
          {
            clicked: handleAttemptClose,
            disabled: pending,
            buttonContent: "Cancel",
          },
          {
            clicked: () => {
              form.handleSubmit(handleSubmit)();
            },
            variant: "primary",
            disabled: pending,
            buttonContent: pending
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update"
                : "Create",
          },
        ]}
        open={open}
        onOpenChange={handleDialogOpenChange}
        dismissible={!pending}
        variant="modal"
        size="xl"
      />

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={() => {
          setShowUnsavedDialog(false);
          closeDialog();
        }}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}
