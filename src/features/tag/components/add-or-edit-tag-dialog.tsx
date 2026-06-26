import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  CreateTagFieldsSchema,
  type ITag,
  type ITransactionType,
} from "@/features/shared/validation/schemas";
import { TagRulesForTagSection } from "@/features/tag-rule/components/tag-rules-for-tag-section";
import { useCreateTagRule } from "@/features/tag-rule/hooks/useTagRules";
import type { IPendingTagRule } from "@/features/tag-rule/types/pending-tag-rule";

import { useCreateTag, useUpdateTag } from "@/features/tag/hooks/useTags";
import { Button } from "@/features/ui/button/button";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { ColorInput } from "@/features/ui/input/color-input";
import { Textarea } from "@/features/ui/input/textarea";
import { RadioGroup } from "@/features/ui/radio/radio-group";
import { RadioItem } from "@/features/ui/radio/radio-item";
import { useToast } from "@/features/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useId, useState } from "react";
import type { Resolver } from "react-hook-form";
import { HiOutlineQueueList } from "react-icons/hi2";
import { type z } from "zod";
import { TagNameWithIconInput } from "./tag-name-with-icon-input";

type IAddOrEditTagDialog = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: ITag;
  initialName?: string;
  initialValues?: Partial<FormData>;
  showTagRules?: boolean;
  onSuccess?: (createdTag?: ITag) => void;
};

type FormData = z.infer<typeof CreateTagFieldsSchema>;

const getEmptyFormValues = (): FormData => ({
  name: "",
  color: "",
  description: "",
  emoticon: "",
  transactionType: "EXPENSE" as ITransactionType,
});

function buildTagSubmitData(data: FormData) {
  const transactionType =
    data.transactionType &&
      (data.transactionType === "EXPENSE" || data.transactionType === "INCOME")
      ? data.transactionType
      : "EXPENSE";

  return {
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
}

export function AddOrEditTagDialog(props: IAddOrEditTagDialog) {
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

function AddOrEditTagDialogContent({
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
  const [tagRulesPanelOverride, setTagRulesPanelOverride] = useState<
    boolean | null
  >(null);
  const [persistedTag, setPersistedTag] = useState<ITag | undefined>();
  const [pendingRules, setPendingRules] = useState<IPendingTagRule[]>([]);
  const activeTag = tag ?? persistedTag;
  const isTagRulesVisible = tagRulesPanelOverride ?? showTagRules;
  const pending = pendingAction !== null;
  const isEditMode = !!tag;
  const isEditingPersistedTag = !isEditMode && !!persistedTag;
  const { mutateAsync: createTag } = useCreateTag();
  const { mutateAsync: updateTag } = useUpdateTag();
  const { mutateAsync: createTagRule } = useCreateTagRule();
  const toast = useToast();

  const formId = useId();

  const form = useFinForm<FormData>({
    resolver: zodResolver(CreateTagFieldsSchema) as Resolver<FormData>,
    defaultValues: getEmptyFormValues(),
  });
  const watchedName = form.watch("name");
  const watchedTransactionType = form.watch("transactionType");
  const hasUnsavedChanges =
    form.formState.isDirty || (!isEditMode && pendingRules.length > 0);

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
    setTagRulesPanelOverride(null);
    setPersistedTag(undefined);
    setPendingRules([]);
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

  useEffect(() => {
    if (!open) return;

    if (tag) {
      form.reset({
        name: tag.name,
        color: tag.color ?? "",
        description: tag.description ?? "",
        emoticon: tag.emoticon ?? "",
        transactionType: tag.transactionType,
      });
    } else {
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
  }, [open, tag, initialName, initialValues, form, focusFirstInput]);

  const resetFormFromTag = useCallback((tagData: ITag) => {
    form.reset({
      name: tagData.name,
      color: tagData.color ?? "",
      description: tagData.description ?? "",
      emoticon: tagData.emoticon ?? "",
      transactionType: tagData.transactionType,
    });
  }, [form]);

  const flushPendingRules = useCallback(async (tagId: string) => {
    for (const { clientId: _clientId, ...rule } of pendingRules) {
      await createTagRule({
        tagId,
        ...rule,
      });
    }
    setPendingRules([]);
  }, [createTagRule, pendingRules]);

  const ensureTagSaved = useCallback(async (): Promise<ITag> => {
    const isValid = await form.trigger();
    if (!isValid) {
      throw new Error("Enter a tag name before adding rules");
    }

    const submitData = buildTagSubmitData(form.getValues());

    if (activeTag && !isOfflineMutationPlaceholder(activeTag)) {
      const updatedTag = await updateTag({
        tagId: activeTag.id,
        input: submitData,
      });

      if (isOfflineMutationPlaceholder(updatedTag)) {
        return activeTag;
      }

      if (pendingRules.length > 0) {
        await flushPendingRules(updatedTag.id);
      }

      setPersistedTag(updatedTag);
      resetFormFromTag(updatedTag);
      return updatedTag;
    }

    const rulesPayload = pendingRules.map(
      ({ clientId: _clientId, ...rule }) => rule,
    );
    const createdTag = await createTag({
      ...submitData,
      ...(rulesPayload.length > 0 ? { rules: rulesPayload } : {}),
    });

    if (isOfflineMutationPlaceholder(createdTag)) {
      throw new Error("Tag could not be created");
    }

    setPendingRules([]);
    setPersistedTag(createdTag);
    resetFormFromTag(createdTag);
    onSuccess?.(createdTag);
    return createdTag;
  }, [
    activeTag,
    createTag,
    flushPendingRules,
    form,
    onSuccess,
    pendingRules,
    resetFormFromTag,
    updateTag,
  ]);

  const processFormSubmit = async (
    data: FormData,
    afterSuccess: "close" | "addAnother",
  ) => {
    const submitData = buildTagSubmitData(data);

    try {
      if ((isEditMode && tag) || isEditingPersistedTag) {
        const tagId = tag?.id ?? persistedTag?.id;
        if (!tagId) {
          return;
        }

        setPendingAction("close");
        const updatedTag = await updateTag({ tagId, input: submitData });
        if (pendingRules.length > 0) {
          await flushPendingRules(tagId);
        }
        resetFormToClosedState();
        setPendingAction(null);
        onOpenChange(false);
        if (!isOfflineMutationPlaceholder(updatedTag)) {
          toast.success("Tag updated successfully");
        }
        onSuccess?.();
      } else {
        const resolvedAfterSuccess = afterSuccess;
        setPendingAction(resolvedAfterSuccess);

        try {
          const rulesPayload = pendingRules.map(
            ({ clientId: _clientId, ...rule }) => rule,
          );
          const createdTag = await createTag({
            ...submitData,
            ...(rulesPayload.length > 0 ? { rules: rulesPayload } : {}),
          });
          const hasRealTag = !isOfflineMutationPlaceholder(createdTag);
          setPendingRules([]);
          const keepOpenForRules = isTagRulesVisible && hasRealTag;

          if (keepOpenForRules) {
            setPersistedTag(createdTag);
            resetFormFromTag(createdTag);
            setPendingAction(null);
            toast.success(
              rulesPayload.length > 0
                ? "Tag and tagging rules created successfully"
                : "Tag created successfully",
            );
            onSuccess?.(createdTag);
            return;
          }

          if (resolvedAfterSuccess === "addAnother") {
            resetFormToClosedState();
            setPendingAction(null);
            if (hasRealTag) {
              toast.success(
                rulesPayload.length > 0
                  ? "Tag and tagging rules created successfully"
                  : "Tag created successfully",
              );
              onSuccess?.(createdTag);
            } else {
              onSuccess?.();
            }
            focusFirstInput();
          } else {
            resetFormToClosedState();
            onOpenChange(false);
            setPendingAction(null);
            if (hasRealTag) {
              toast.success(
                rulesPayload.length > 0
                  ? "Tag and tagging rules created successfully"
                  : "Tag created successfully",
              );
              onSuccess?.(createdTag);
            } else {
              onSuccess?.();
            }
          }
        } catch {
          setPendingAction(null);
          toast.error("Failed to create tag");
          throw new Error("Failed to create tag");
        }
      }
    } catch (err) {
      setPendingAction(null);
      throw err;
    }
  };

  const tagFormFields = (
    <>
      <RadioGroup
        name="transactionType"
        label="Type"
        required
        disabled={pending}
      >
        <RadioItem value="EXPENSE">Expense</RadioItem>
        <RadioItem value="INCOME">Income</RadioItem>
      </RadioGroup>
      <TagNameWithIconInput
        disabled={pending}
        required
        transactionType={watchedTransactionType}
      />
      <ColorInput
        name="color"
        label="Color"
        disabled={pending}
      />
      <Textarea
        name="description"
        label="Description"
        disabled={pending}
      />
    </>
  );

  const dialogTitle =
    isEditMode || isEditingPersistedTag ? "Edit Tag" : "Create Tag";
  const showAddAnotherButton = !isEditMode && !isEditingPersistedTag;
  const submitButtonLabel =
    isEditMode || isEditingPersistedTag ? "Update" : "Create";
  const submitButtonLoadingText =
    isEditMode || isEditingPersistedTag ? "Updating tag" : "Creating tag";

  return (
    <>
      <Dialog
        title={dialogTitle}
        headerActions={
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={pending}
            clicked={() =>
              setTagRulesPanelOverride((visible) => !(visible ?? showTagRules))
            }>
            <HiOutlineQueueList className="size-4" />
            {isTagRulesVisible ? "Hide tagging rules" : "Tagging rules"}
          </Button>
        }
        disableInitialFocus
        content={
          isTagRulesVisible ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <Form<FormData>
                form={form}
                onSubmit={(data) => processFormSubmit(data, "close")}
                id={formId}>
                <div className="space-y-4">{tagFormFields}</div>
              </Form>
              <TagRulesForTagSection
                tag={activeTag}
                tagPreview={{
                  name: watchedName.trim(),
                  transactionType: watchedTransactionType,
                }}
                pendingRules={activeTag ? undefined : pendingRules}
                onPendingRulesChange={activeTag ? undefined : setPendingRules}
                ensureTag={ensureTagSaved}
                onTagEnsured={(ensuredTag) => {
                  setPersistedTag(ensuredTag);
                  resetFormFromTag(ensuredTag);
                }}
              />
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
          ...(showAddAnotherButton
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
              text: submitButtonLoadingText,
            },
            buttonContent: submitButtonLabel,
          },
        ]}
        open={open}
        onOpenChange={handleDialogOpenChange}
        dismissible={!pending}
        variant="modal"
        size={isTagRulesVisible ? "3/4" : "xl"}
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
