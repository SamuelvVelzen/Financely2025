import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  CreateTagRuleInputSchema,
  type ITagRule,
  type ITransactionType,
} from "@/features/shared/validation/schemas";
import {
  useCreateTagRule,
  useUpdateTagRule,
} from "@/features/tag-rule/hooks/useTagRules";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { TextInput } from "@/features/ui/input/text-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { TagSelect } from "@/features/ui/tag-select/tag-select";
import { useToast } from "@/features/ui/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useId, useState } from "react";
import { z } from "zod";

type IAddOrEditTagRuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: ITagRule;
  initialValues?: Partial<FormData>;
  lockTagId?: string;
  transactionType?: ITransactionType;
  onSuccess?: () => void;
};

const TagRuleFormSchema = CreateTagRuleInputSchema.omit({
  keywords: true,
  source: true,
}).extend({
  keywordsText: z.string().min(1, "At least one keyword is required"),
});

type FormData = z.infer<typeof TagRuleFormSchema>;

const MATCH_FIELD_OPTIONS = [
  { value: "NAME", label: "Transaction name" },
  { value: "DESCRIPTION", label: "Description" },
  { value: "BOTH", label: "Name and description" },
] as const;

const APPLY_AS_OPTIONS = [
  { value: "PRIMARY", label: "Primary tag" },
  { value: "TAG", label: "Other tags" },
  { value: "BOTH", label: "Primary and other tags" },
] as const;

function getEmptyFormValues(): FormData {
  return {
    tagId: "",
    label: "",
    keywordsText: "",
    pattern: null,
    patternType: "KEYWORD",
    matchField: "NAME",
    applyAs: "PRIMARY",
    priority: 0,
    enabled: true,
  };
}

function keywordsToText(keywords: string[]): string {
  return keywords.join(", ");
}

function textToKeywords(text: string): string[] {
  return text
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

export function AddOrEditTagRuleDialog({
  open,
  onOpenChange,
  rule,
  initialValues,
  lockTagId,
  transactionType,
  onSuccess,
}: IAddOrEditTagRuleDialogProps) {
  const [pending, setPending] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const isEditMode = !!rule;
  const { mutateAsync: createTagRule } = useCreateTagRule();
  const { mutateAsync: updateTagRule } = useUpdateTagRule();
  const toast = useToast();
  const formId = useId();

  const form = useFinForm<FormData>({
    resolver: zodResolver(TagRuleFormSchema),
    defaultValues: getEmptyFormValues(),
  });
  const hasUnsavedChanges = form.formState.isDirty;

  const focusFirstInput = useCallback(() => {
    requestAnimationFrame(() => {
      void form.setFocus("label");
    });
  }, [form]);

  const closeDialog = () => {
    form.reset(getEmptyFormValues());
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

  useEffect(() => {
    if (!open) {
      form.reset(getEmptyFormValues());
      return;
    }

    if (rule) {
      form.reset({
        tagId: rule.tagId,
        label: rule.label ?? "",
        keywordsText: keywordsToText(rule.keywords),
        pattern: rule.pattern,
        patternType: rule.patternType,
        matchField: rule.matchField,
        applyAs: rule.applyAs,
        priority: rule.priority,
        enabled: rule.enabled,
      });
    } else if (initialValues) {
      form.reset({
        ...getEmptyFormValues(),
        ...initialValues,
        tagId: lockTagId ?? initialValues.tagId ?? "",
        keywordsText:
          initialValues.keywordsText ??
          keywordsToText(
            "keywords" in initialValues && initialValues.keywords
              ? initialValues.keywords
              : [],
          ),
      });
    } else {
      form.reset({
        ...getEmptyFormValues(),
        tagId: lockTagId ?? "",
      });
    }

    focusFirstInput();
  }, [open, rule, initialValues, lockTagId, form, focusFirstInput]);

  const handleSubmit = async (data: FormData) => {
    setPending(true);
    const keywords = textToKeywords(data.keywordsText);
    const payload = {
      tagId: lockTagId ?? data.tagId,
      label: data.label?.trim() || null,
      keywords,
      pattern: data.pattern ?? null,
      patternType: data.patternType,
      matchField: data.matchField,
      applyAs: data.applyAs,
      priority: data.priority,
      enabled: data.enabled,
    };

    try {
      if (isEditMode && rule) {
        const result = await updateTagRule({
          ruleId: rule.id,
          input: payload,
        });
        if (!isOfflineMutationPlaceholder(result)) {
          toast.success("Tag rule updated");
        }
      } else {
        const result = await createTagRule(payload);
        if (!isOfflineMutationPlaceholder(result)) {
          toast.success("Tag rule created");
        }
      }
      onSuccess?.();
      closeDialog();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save tag rule",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Dialog
        title={isEditMode ? "Edit tag rule" : "Add tag rule"}
        content={
          <Form form={form} onSubmit={handleSubmit} id={formId} className="space-y-4">
            <TextInput
              name="label"
              label="Label"
              placeholder="e.g. Dutch supermarkets"
              disabled={pending}
            />
            {!lockTagId && (
              <TagSelect
                name="tagId"
                label="Target tag"
                placeholder="Select tag..."
                disabled={pending}
                transactionType={transactionType}
              />
            )}
            <TextInput
              name="keywordsText"
              label="Keywords"
              placeholder="albert heijn, jumbo, dirk"
              hint="Separate keywords with commas"
              disabled={pending}
            />
            <SelectDropdown
              name="matchField"
              label="Match field"
              options={[...MATCH_FIELD_OPTIONS]}
              disabled={pending}
              clearable={false}
            />
            <SelectDropdown
              name="applyAs"
              label="Apply as"
              options={[...APPLY_AS_OPTIONS]}
              disabled={pending}
              clearable={false}
            />
          </Form>
        }
        footerButtons={[
          {
            clicked: handleAttemptClose,
            disabled: pending,
            buttonContent: "Cancel",
          },
          {
            variant: "primary",
            type: "submit",
            form: formId,
            disabled: pending,
            buttonContent: isEditMode ? "Save" : "Create",
          },
        ]}
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            onOpenChange(true);
            return;
          }
          handleAttemptClose();
        }}
        dismissible={!pending}
        variant="modal"
        size="lg"
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
