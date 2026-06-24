import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  CreateTagInputSchema,
  type ITag,
  type ITransactionType,
} from "@/features/shared/validation/schemas";
import { useCreateTag, useUpdateTag } from "@/features/tag/hooks/useTags";
import { TagRulesForTagSection } from "@/features/tag-rule/components/tag-rules-for-tag-section";
import { Button } from "@/features/ui/button/button";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { ColorInput } from "@/features/ui/input/color-input";
import { EmoticonInput } from "@/features/ui/input/emoticon-input";
import { TextInput } from "@/features/ui/input/text-input";
import { RadioGroup } from "@/features/ui/radio/radio-group";
import { RadioItem } from "@/features/ui/radio/radio-item";
import { useToast } from "@/features/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useId, useState } from "react";
import type { Resolver } from "react-hook-form";
import { HiOutlineQueueList } from "react-icons/hi2";
import { type z } from "zod";

type IAddOrEditTagDialog = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: ITag;
  initialName?: string;
  initialValues?: Partial<FormData>;
  showTagRules?: boolean;
  onSuccess?: (createdTag?: ITag) => void;
};

type FormData = z.infer<typeof CreateTagInputSchema>;

const getEmptyFormValues = (): FormData => ({
  name: "",
  color: "",
  description: "",
  emoticon: "",
  transactionType: "EXPENSE" as ITransactionType,
});

export function AddOrEditTagDialog({
  open,
  onOpenChange,
  tag,
  initialName,
  initialValues,
  showTagRules = false,
  onSuccess,
}: IAddOrEditTagDialog) {
  const [pendingAction, setPendingAction] = useState<
    null | "close" | "addAnother"
  >(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isTagRulesVisible, setIsTagRulesVisible] = useState(false);
  const pending = pendingAction !== null;
  const isEditMode = !!tag;
  const { mutate: createTag } = useCreateTag();
  const { mutate: updateTag } = useUpdateTag();
  const toast = useToast();

  const formId = useId();

  const form = useFinForm<FormData>({
    resolver: zodResolver(CreateTagInputSchema) as Resolver<FormData>,
    defaultValues: getEmptyFormValues(),
  });
  const hasUnsavedChanges = form.formState.isDirty;

  const focusFirstInput = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        void form.setFocus("name");
      });
    });
  }, [form]);

  const resetFormToClosedState = () => {
    form.reset(getEmptyFormValues());
  };

  const closeDialog = () => {
    resetFormToClosedState();
    setIsTagRulesVisible(false);
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
      setIsTagRulesVisible(showTagRules);
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
          emoticon: tag.emoticon ?? "",
          transactionType: tag.transactionType,
        });
      } else {
        // Create mode: reset to defaults or use initial name/values
        form.reset({
          name: initialValues?.name || initialName || "",
          color: initialValues?.color || "",
          description: initialValues?.description || "",
          emoticon: initialValues?.emoticon || "",
          transactionType: (initialValues?.transactionType ||
            "EXPENSE") as ITransactionType,
        });
      }
      focusFirstInput();
    } else {
      // Reset form when dialog closes to ensure clean state
      form.reset(getEmptyFormValues());
    }
  }, [open, tag, initialName, initialValues, form, focusFirstInput]);

  const processFormSubmit = async (
    data: FormData,
    afterSuccess: "close" | "addAnother",
  ) => {
    // Ensure transactionType is valid (default to EXPENSE if not set)
    const transactionType =
      data.transactionType &&
        (data.transactionType === "EXPENSE" || data.transactionType === "INCOME")
        ? data.transactionType
        : "EXPENSE";

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
      emoticon:
        data.emoticon && data.emoticon.trim() !== ""
          ? data.emoticon.trim()
          : null,
      transactionType: transactionType as ITransactionType,
    };

    try {
      if (isEditMode && tag) {
        setPendingAction("close");
        updateTag(
          { tagId: tag.id, input: submitData },
          {
            onSuccess: (data) => {
              resetFormToClosedState();
              setPendingAction(null);
              onOpenChange(false);
              if (!isOfflineMutationPlaceholder(data)) {
                toast.success("Tag updated successfully");
              }
              onSuccess?.();
            },
            onError: (error) => {
              setPendingAction(null);
              toast.error("Failed to update tag");
              throw error;
            },
          }
        );
      } else {
        const resolvedAfterSuccess = afterSuccess;
        setPendingAction(resolvedAfterSuccess);
        createTag(submitData, {
          onSuccess: (createdTag) => {
            if (resolvedAfterSuccess === "addAnother") {
              resetFormToClosedState();
              setPendingAction(null);
              if (!isOfflineMutationPlaceholder(createdTag)) {
                toast.success("Tag created successfully");
                onSuccess?.(createdTag);
              } else {
                onSuccess?.();
              }
              focusFirstInput();
            } else {
              resetFormToClosedState();
              onOpenChange(false);
              setPendingAction(null);
              if (!isOfflineMutationPlaceholder(createdTag)) {
                toast.success("Tag created successfully");
                onSuccess?.(createdTag);
              } else {
                onSuccess?.();
              }
            }
          },
          onError: (error) => {
            setPendingAction(null);
            toast.error("Failed to create tag");
            throw error;
          },
        });
      }
    } catch (err) {
      setPendingAction(null);
      throw err; // Let Form component handle the error
    }
  };

  const tagFormFields = (
    <>
      <RadioGroup
        name="transactionType"
        label="Type"
        required
        disabled={pending}
        orientation="horizontal">
        <RadioItem value="EXPENSE">Expense</RadioItem>
        <RadioItem value="INCOME">Income</RadioItem>
      </RadioGroup>
      <TextInput
        name="name"
        label="Name"
        disabled={pending}
        required
      />
      <EmoticonInput
        name="emoticon"
        label="Emoticon"
        placeholder="e.g., 🍔 or :food:"
        disabled={pending}
        hint="Optional emoji to represent this tag. Type :emoji: for autocomplete or click the button to browse."
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
    </>
  );

  return (
    <>
      <Dialog
        title={isEditMode ? "Edit Tag" : "Create Tag"}
        headerActions={
          isEditMode ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={pending}
              clicked={() => setIsTagRulesVisible((visible) => !visible)}>
              <HiOutlineQueueList className="size-4" />
              {isTagRulesVisible ? "Hide tagging rules" : "Tagging rules"}
            </Button>
          ) : undefined
        }
        disableInitialFocus
        content={
          isEditMode && tag ? (
            <div
              className={
                isTagRulesVisible
                  ? "grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
                  : undefined
              }>
              <Form<FormData>
                form={form}
                onSubmit={(data) => processFormSubmit(data, "close")}
                id={formId}>
                <div className="space-y-4">{tagFormFields}</div>
              </Form>
              {isTagRulesVisible && (
                <TagRulesForTagSection
                  tag={tag}
                  onClose={() => setIsTagRulesVisible(false)}
                />
              )}
            </div>
          ) : (
            <Form<FormData>
              form={form}
              onSubmit={(data) => processFormSubmit(data, "close")}
              id={formId}>
              <div className="space-y-4">{tagFormFields}</div>
            </Form>
          )
        }
        footerButtons={[
          {
            clicked: handleAttemptClose,
            disabled: pending,
            buttonContent: "Cancel",
          },
          ...(!isEditMode
            ? [
                {
                  variant: "default" as const,
                  clicked: () => {
                    void form.handleSubmit((data) =>
                      processFormSubmit(data, "addAnother"),
                    )();
                  },
                  disabled: pending,
                  loading: {
                    isLoading: pendingAction === "addAnother",
                    text: "Creating tag",
                  },
                  buttonContent: "Create & add another",
                },
              ]
            : []),
          {
            type: "submit",
            form: formId,
            variant: "primary" as const,
            disabled: pending,
            loading: {
              isLoading: pendingAction === "close",
              text: isEditMode ? "Updating tag" : "Creating tag",
            },
            buttonContent: isEditMode ? "Update" : "Create",
          },
        ]}
        open={open}
        onOpenChange={handleDialogOpenChange}
        dismissible={!pending}
        variant="modal"
        size={isEditMode && isTagRulesVisible ? "3/4" : "xl"}
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
