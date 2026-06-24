import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { ITheme } from "@/features/shared/validation/schemas";
import {
  ThemeSchema,
  UpdateUserSettingInputSchema,
} from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Container } from "@/features/ui/container/container";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { useTheme } from "@/features/ui/theme-context";
import { useToast } from "@/features/ui/toast";
import { Label } from "@/features/ui/typography/label";
import { ScrollableHeader } from "@/features/ui/typography/scrollable-header";
import { getBrowserLanguage } from "@/features/users/utils/browser-defaults";
import {
  useUpdateUserSettings,
  useUserSettings,
} from "@/features/users/hooks/useUserSettings";
import { useMe } from "@/features/users/hooks/useUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "nl-NL", label: "Dutch (Netherlands)" },
  { value: "de-DE", label: "German" },
  { value: "fr-FR", label: "French" },
  { value: "ja-JP", label: "Japanese" },
] as const;

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

const UserPreferencesFormSchema = UpdateUserSettingInputSchema.extend({
  defaultWorkspaceId: z.number().int().nullable(),
  defaultLanguage: z.string().nullable(),
  theme: ThemeSchema.nullable(),
});

type IUserPreferencesForm = z.infer<typeof UserPreferencesFormSchema>;

function NotSetValue() {
  return <span className="text-text-muted">Not set</span>;
}

function formatLanguage(value: string | null | undefined): string {
  if (!value) {
    return `Browser default (${getBrowserLanguage()})`;
  }
  const match = LANGUAGE_OPTIONS.find((o) => o.value === value);
  return match?.label ?? value;
}

function formatTheme(value: ITheme | null | undefined): string {
  if (!value) {
    return "System";
  }
  const match = THEME_OPTIONS.find((o) => o.value === value);
  return match?.label ?? value;
}

export function UserPreferences() {
  const { data: settings, isLoading } = useUserSettings();
  const { data: me } = useMe();
  const updateSettings = useUpdateUserSettings();
  const { setTheme } = useTheme();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const workspaceOptions = useMemo(
    () =>
      (me?.workspaces ?? []).map((w) => ({
        value: w.id,
        label: w.name,
      })),
    [me?.workspaces],
  );

  const form = useFinForm<IUserPreferencesForm>({
    resolver: zodResolver(UserPreferencesFormSchema),
    defaultValues: {
      defaultWorkspaceId: null,
      defaultLanguage: null,
      theme: null,
    },
  });

  useEffect(() => {
    form.reset({
      defaultWorkspaceId: settings?.defaultWorkspaceId ?? null,
      defaultLanguage: settings?.defaultLanguage ?? null,
      theme: settings?.theme ?? null,
    });
  }, [settings, form]);

  const handleSubmit = async (data: IUserPreferencesForm) => {
    try {
      const result = await updateSettings.mutateAsync(data);
      if (!isOfflineMutationPlaceholder(result) && data.theme) {
        setTheme(data.theme);
      }
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success("Preferences saved");
      }
      setIsEditing(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save preferences",
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
      defaultWorkspaceId: settings?.defaultWorkspaceId ?? null,
      defaultLanguage: settings?.defaultLanguage ?? null,
      theme: settings?.theme ?? null,
    });
    setShowUnsavedDialog(false);
    setIsEditing(false);
  };

  const workspaceName =
    settings?.defaultWorkspaceId != null
      ? me?.workspaces.find((w) => w.id === settings.defaultWorkspaceId)?.name
      : null;

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Container>
        <div className="flex items-center justify-between mb-4">
          <ScrollableHeader id="user-preferences">
            Your preferences
          </ScrollableHeader>
          <IconButton
            clicked={isEditing ? handleCancelEdit : () => setIsEditing(true)}
            ariaLabel={isEditing ? "Cancel editing" : "Edit preferences"}>
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
            <SelectDropdown<number>
              name="defaultWorkspaceId"
              label="Default workspace"
              options={workspaceOptions}
              placeholder="Not set"
              clearable
              stringToValue={(v) => (v ? Number(v) : null)}
              valueToString={(v) => (v != null ? String(v) : "")}
            />
          ) : (
            <div>
              <Label>Default workspace</Label>
              <p className="text-text mt-1">
                {workspaceName ?? <NotSetValue />}
              </p>
            </div>
          )}

          {isEditing ? (
            <SelectDropdown
              name="defaultLanguage"
              label="Language"
              options={[...LANGUAGE_OPTIONS]}
              placeholder="Browser default"
              clearable
            />
          ) : (
            <div>
              <Label>Language</Label>
              <p className="text-text mt-1">
                {formatLanguage(settings?.defaultLanguage)}
              </p>
            </div>
          )}

          {isEditing ? (
            <SelectDropdown
              name="theme"
              label="Theme"
              options={[...THEME_OPTIONS]}
              placeholder="System"
              clearable={false}
            />
          ) : (
            <div>
              <Label>Theme</Label>
              <p className="text-text mt-1">
                {formatTheme(settings?.theme)}
              </p>
            </div>
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
