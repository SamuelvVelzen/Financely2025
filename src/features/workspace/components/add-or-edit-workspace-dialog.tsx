import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  CreateWorkspaceBodySchema,
  type IWorkspaceSummary,
} from "@/features/shared/validation/schemas";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { TextInput } from "@/features/ui/input/text-input";
import { useToast } from "@/features/ui/toast";
import { useCreateWorkspace } from "@/features/workspace/hooks/useWorkspaces";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useId, useState } from "react";
import { z } from "zod";

type IAddOrEditWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSuccess?: (created?: IWorkspaceSummary) => void;
};

type IFormData = z.infer<typeof CreateWorkspaceBodySchema>;

const getEmptyFormValues = (): IFormData => ({
  name: "",
});

export function AddOrEditWorkspaceDialog({
  open,
  onOpenChange,
  initialName,
  onSuccess,
}: IAddOrEditWorkspaceDialogProps) {
  const [pending, setPending] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const { mutate: createWorkspace } = useCreateWorkspace();
  const toast = useToast();
  const formId = useId();

  const form = useFinForm<IFormData>({
    resolver: zodResolver(CreateWorkspaceBodySchema),
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
    if (open) {
      form.reset({
        name: initialName || "",
      });
      focusFirstInput();
    } else {
      form.reset(getEmptyFormValues());
    }
  }, [open, initialName, form, focusFirstInput]);

  const processFormSubmit = async (data: IFormData) => {
    setPending(true);
    createWorkspace(
      { name: data.name.trim() },
      {
        onSuccess: (created) => {
          resetFormToClosedState();
          onOpenChange(false);
          setPending(false);
          if (!isOfflineMutationPlaceholder(created)) {
            toast.success("Workspace created successfully");
            onSuccess?.(created);
          } else {
            onSuccess?.();
          }
        },
        onError: () => {
          setPending(false);
          toast.error("Failed to create workspace");
        },
      },
    );
  };

  return (
    <>
      <Dialog
        title="Create Workspace"
        disableInitialFocus
        content={
          <Form<IFormData>
            form={form}
            onSubmit={processFormSubmit}
            id={formId}>
            <TextInput
              name="name"
              label="Name"
              disabled={pending}
              required
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
            type: "submit",
            form: formId,
            variant: "primary",
            disabled: pending,
            loading: {
              isLoading: pending,
              text: "Creating workspace",
            },
            buttonContent: "Create",
          },
        ]}
        open={open}
        onOpenChange={handleDialogOpenChange}
        dismissible={!pending}
        variant="modal"
        size="md"
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
