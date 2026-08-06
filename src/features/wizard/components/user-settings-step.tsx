import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { ITheme } from "@/features/shared/validation/schemas";
import {
  ThemeSchema,
  UpdateUserSettingInputSchema,
} from "@/features/shared/validation/schemas";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { Spinner } from "@/features/ui/loading/spinner";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { useTheme } from "@/features/ui/theme-context";
import { useToast } from "@/features/ui/toast";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import {
  useUpdateUserSettings,
  useUserSettings,
} from "@/features/users/hooks/useUserSettings";
import { getBrowserLanguage } from "@/features/users/utils/browser-defaults";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
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

const UserSettingsStepSchema = UpdateUserSettingInputSchema.extend({
  defaultLanguage: z.string().nullable(),
  theme: ThemeSchema.nullable(),
});

type IUserSettingsStepForm = z.infer<typeof UserSettingsStepSchema>;

export function UserSettingsStep() {
  const { data: settings, isLoading } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const { setTheme } = useTheme();
  const toast = useToast();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useFinForm<IUserSettingsStepForm>({
    resolver: zodResolver(UserSettingsStepSchema),
    defaultValues: {
      defaultLanguage: null,
      theme: "system",
    },
  });

  useEffect(() => {
    form.reset({
      defaultLanguage: settings?.defaultLanguage ?? null,
      theme: settings?.theme ?? "system",
    });
  }, [settings, form]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const scheduleSave = (patch: Partial<IUserSettingsStepForm>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      const data = { ...form.getValues(), ...patch };
      try {
        const result = await updateSettings.mutateAsync({
          defaultLanguage: data.defaultLanguage,
          theme: data.theme,
        });
        if (!isOfflineMutationPlaceholder(result) && data.theme) {
          setTheme(data.theme);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save preferences",
        );
      }
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <Title className="text-3xl mb-4">Your preferences</Title>
        <Text
          size="lg"
          isMuted
          className="max-w-md mx-auto">
          Choose how Financely looks and which language to use. You can change
          these anytime in Account.
        </Text>
      </div>

      <Form
        form={form}
        onSubmit={() => {}}
        className="space-y-4 max-w-md mx-auto">
        <SelectDropdown
          name="defaultLanguage"
          label="Language"
          options={[...LANGUAGE_OPTIONS]}
          placeholder={`Browser default (${getBrowserLanguage()})`}
          clearable
          onValueChange={(value) => {
            const language = (value as string | undefined) ?? null;
            scheduleSave({ defaultLanguage: language });
          }}
        />
        <SelectDropdown
          name="theme"
          label="Theme"
          options={[...THEME_OPTIONS]}
          placeholder="System"
          clearable={false}
          onValueChange={(value) => {
            const theme = (value as ITheme | undefined) ?? "system";
            setTheme(theme);
            scheduleSave({ theme });
          }}
        />
      </Form>
    </div>
  );
}
