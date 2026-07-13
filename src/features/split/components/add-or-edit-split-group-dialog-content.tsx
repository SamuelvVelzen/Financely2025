import { CurrencySelect } from "@/features/currency/components/currency-select";
import {
  useCreateSplitGroup,
  useUpdateSplitGroup,
} from "@/features/split/hooks/use-split-groups";
import {
  getEmptySplitGroupFormValues,
  getSplitGroupFormValuesFromGroup,
  type IAddOrEditSplitGroupDialogProps,
  type ISplitGroupFormValues,
} from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { BottomSheet } from "@/features/ui/dialog/bottom-sheet";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { TextInput } from "@/features/ui/input/text-input";
import { useToast } from "@/features/ui/toast";
import { useId, useState } from "react";

function SplitGroupForm({
  formId,
  initialValues,
  canChangeCurrency,
  disabled,
  onSubmit,
}: {
  formId: string;
  initialValues: ISplitGroupFormValues;
  canChangeCurrency: boolean;
  disabled?: boolean;
  onSubmit: (values: ISplitGroupFormValues) => void;
}) {
  const workspaceId = useNavWorkspaceId();
  const [name, setName] = useState(initialValues.name);
  const [currency, setCurrency] = useState(initialValues.defaultCurrency);

  const trimmedName = name.trim();
  const hasChanges =
    trimmedName !== initialValues.name.trim() ||
    (canChangeCurrency && currency !== initialValues.defaultCurrency);
  const canSubmit = trimmedName.length > 0 && hasChanges && !disabled;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    onSubmit({ name: trimmedName, defaultCurrency: currency });
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4 p-4">
      <TextInput
        label="Group name"
        value={name}
        onChange={(v) => setName(String(v ?? ""))}
        placeholder="Barcelona trip"
        disabled={disabled}
      />
      <CurrencySelect
        label="Balance currency"
        value={currency}
        onChange={(v) => {
          if (typeof v === "string") {
            setCurrency(v);
          }
        }}
        workspaceId={workspaceId}
        disabled={!canChangeCurrency || disabled}
        hint={
          canChangeCurrency
            ? "Used to settle balances between members"
            : "Currency cannot be changed after the first expense"
        }
      />
      <button type="submit" className="sr-only" disabled={!canSubmit}>
        Submit
      </button>
    </form>
  );
}

export function AddOrEditSplitGroupDialogContent({
  open,
  onOpenChange,
  group,
  defaultCurrency,
  onSuccess,
}: IAddOrEditSplitGroupDialogProps) {
  const { isMobile } = useResponsive();
  const toast = useToast();
  const formId = useId();
  const isEditMode = group != null;
  const canChangeCurrency = !isEditMode || group.expenseCount === 0;
  const createGroup = useCreateSplitGroup();
  const updateGroup = useUpdateSplitGroup(group?.id ?? "");
  const isPending = createGroup.isPending || updateGroup.isPending;

  const initialValues = group
    ? getSplitGroupFormValuesFromGroup(group)
    : getEmptySplitGroupFormValues(defaultCurrency);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = async (values: ISplitGroupFormValues) => {
    try {
      if (isEditMode && group) {
        await updateGroup.mutateAsync({
          name: values.name,
          ...(canChangeCurrency
            ? { defaultCurrency: values.defaultCurrency }
            : {}),
        });
        toast.success("Group updated");
      } else {
        await createGroup.mutateAsync({
          name: values.name,
          defaultCurrency: values.defaultCurrency,
        });
        toast.success("Group created");
      }
      handleClose();
      onSuccess?.();
    } catch {
      toast.error(
        isEditMode ? "Could not update group" : "Could not create group",
      );
    }
  };

  const title = isEditMode ? "Edit group" : "New split group";
  const submitLabel = isEditMode ? "Save" : "Create group";
  const submitLoadingText = isEditMode ? "Saving group" : "Creating group";

  const form = open ? (
    <SplitGroupForm
      formId={formId}
      initialValues={initialValues}
      canChangeCurrency={canChangeCurrency}
      disabled={isPending}
      onSubmit={(values) => void handleSubmit(values)}
    />
  ) : null;

  const footerButtons = [
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
        text: submitLoadingText,
      },
      buttonContent: submitLabel,
    },
  ];

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        footerButtons={footerButtons}>
        {form}
      </BottomSheet>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      content={form}
      footerButtons={footerButtons}
      dismissible={!isPending}
    />
  );
}
