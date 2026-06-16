import { CurrencySelect } from "@/features/currency/components/currency-select";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  CurrencySchema,
  UpdateWorkspaceSettingInputSchema,
} from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { Container } from "@/features/ui/container/container";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { useToast } from "@/features/ui/toast";
import { Label } from "@/features/ui/typography/label";
import { ScrollableHeader } from "@/features/ui/typography/scrollable-header";
import { useMe } from "@/features/users/hooks/useUser";
import { getBrowserCurrency } from "@/features/users/utils/browser-defaults";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import {
  useUpdateWorkspaceSettings,
  useWorkspaceSettings,
} from "@/features/workspace/hooks/useWorkspaceSettings";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { Link } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { z } from "zod";

const WorkspacePreferencesFormSchema =
  UpdateWorkspaceSettingInputSchema.extend({
    defaultCurrency: CurrencySchema.nullable(),
    smartTaggingEnabled: z.boolean(),
    historyLearningEnabled: z.boolean(),
  });

type IWorkspacePreferencesForm = z.infer<typeof WorkspacePreferencesFormSchema>;

function formatCurrency(value: string | null | undefined): string {
  if (!value) {
    return `Browser default (${getBrowserCurrency()})`;
  }
  return value;
}

export function WorkspacePreferences() {
  const workspaceId = useNavWorkspaceId();
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);
  const { data: me } = useMe();
  const { data: settings, isLoading } = useWorkspaceSettings(workspaceId);
  const updateSettings = useUpdateWorkspaceSettings(workspaceId);
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const workspace = me?.workspaces.find((w) => w.id === workspaceId);

  const form = useFinForm<IWorkspacePreferencesForm>({
    resolver: zodResolver(WorkspacePreferencesFormSchema),
    defaultValues: {
      defaultCurrency: null,
      smartTaggingEnabled: true,
      historyLearningEnabled: true,
    },
  });

  useEffect(() => {
    form.reset({
      defaultCurrency: settings?.defaultCurrency ?? null,
      smartTaggingEnabled: settings?.smartTaggingEnabled ?? true,
      historyLearningEnabled: settings?.historyLearningEnabled ?? true,
    });
  }, [settings, form]);

  const handleSubmit = async (data: IWorkspacePreferencesForm) => {
    try {
      const result = await updateSettings.mutateAsync(data);
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success("Workspace preferences saved");
      }
      setIsEditing(false);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to save workspace preferences",
      );
    }
  };

  const handleCancelEdit = () => {
    if (form.formState.isDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    setIsEditing(false);
  };

  const handleDiscardChanges = () => {
    form.reset({
      defaultCurrency: settings?.defaultCurrency ?? null,
      smartTaggingEnabled: settings?.smartTaggingEnabled ?? true,
      historyLearningEnabled: settings?.historyLearningEnabled ?? true,
    });
    setShowUnsavedDialog(false);
    setIsEditing(false);
  };

  if (workspaceId === null || isLoading) {
    return (
      <Container>
        <ScrollableHeader id="workspace-preferences">
          Workspace preferences
        </ScrollableHeader>
        <p className="text-text-muted text-sm mt-2">Loading…</p>
      </Container>
    );
  }

  return (
    <>
      <Container>
        <div className="flex items-center justify-between mb-4">
          <div>
            <ScrollableHeader id="workspace-preferences">
              Workspace preferences
            </ScrollableHeader>
            <p className="text-text-muted text-sm mt-1">
              Settings for{" "}
              <span className="text-text font-medium">
                {workspace?.name ?? "workspace"}
              </span>{" "}
              (selected in the sidebar)
            </p>
          </div>
          <IconButton
            clicked={isEditing ? handleCancelEdit : () => setIsEditing(true)}
            ariaLabel={
              isEditing ? "Cancel editing" : "Edit workspace preferences"
            }>
            {isEditing ? (
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            )}
          </IconButton>
        </div>

        <Form
          form={form}
          onSubmit={isEditing ? handleSubmit : () => {}}
          className="space-y-4">
          {isEditing ? (
            <>
              <CurrencySelect
                name="defaultCurrency"
                label="Default currency"
                clearable
              />
              <Controller
                name="smartTaggingEnabled"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    label="Enable smart tagging"
                    hint="Suggest tags based on rules when creating or importing transactions"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                )}
              />
              <Controller
                name="historyLearningEnabled"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    label="Enable history-based suggestions"
                    hint="Show tag rule suggestions learned from your past transactions"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                )}
              />
              <p className="text-sm text-text-muted">
                <Link
                  to="/$workspaceId/smart-tagging"
                  params={{ workspaceId: workspaceRouteParam }}
                  className="text-primary hover:underline">
                  Manage smart tagging rules
                </Link>
              </p>
            </>
          ) : (
            <>
              <div>
                <Label>Default currency</Label>
                <p className="text-text mt-1">
                  {formatCurrency(settings?.defaultCurrency)}
                </p>
              </div>
              <div>
                <Label>Smart tagging</Label>
                <p className="text-text mt-1">
                  {settings?.smartTaggingEnabled ?? true ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div>
                <Label>History-based suggestions</Label>
                <p className="text-text mt-1">
                  {settings?.historyLearningEnabled ?? true
                    ? "Enabled"
                    : "Disabled"}
                </p>
              </div>
              <p className="text-sm text-text-muted">
                <Link
                  to="/$workspaceId/smart-tagging"
                  params={{ workspaceId: workspaceRouteParam }}
                  className="text-primary hover:underline">
                  Manage smart tagging rules
                </Link>
              </p>
            </>
          )}

          {isEditing && (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="default"
                clicked={handleCancelEdit}
                disabled={updateSettings.isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={updateSettings.isPending || !form.formState.isDirty}>
                {updateSettings.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </Form>
      </Container>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={handleDiscardChanges}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}
