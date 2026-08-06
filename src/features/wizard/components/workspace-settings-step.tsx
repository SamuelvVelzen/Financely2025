import { CurrencySelect } from "@/features/currency/components/currency-select";
import type { ICurrency } from "@/features/currency/config/currencies";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import {
  CurrencySchema,
  UpdateWorkspaceSettingInputSchema,
} from "@/features/shared/validation/schemas";
import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { Spinner } from "@/features/ui/loading/spinner";
import { useToast } from "@/features/ui/toast";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";
import { getBrowserCurrency } from "@/features/users/utils/browser-defaults";
import {
  useUpdateWorkspaceSettings,
  useWorkspaceSettings,
} from "@/features/workspace/hooks/useWorkspaceSettings";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { Controller } from "react-hook-form";
import { z } from "zod";

const WorkspaceSettingsStepSchema = UpdateWorkspaceSettingInputSchema.extend({
  defaultCurrency: CurrencySchema.nullable(),
  smartTaggingEnabled: z.boolean(),
  historyLearningEnabled: z.boolean(),
});

type IWorkspaceSettingsStepForm = z.infer<typeof WorkspaceSettingsStepSchema>;

export interface IWorkspaceSettingsStepProps {
  workspaceId: IWorkspaceId | null;
  title?: string;
  description?: string;
  /** Hide the large title block (e.g. when embedded in a dialog). */
  compact?: boolean;
}

export function WorkspaceSettingsStep({
  workspaceId,
  title = "Workspace settings",
  description = "This is the currency for everyday transactions and budgets. You can still log foreign currencies later when traveling.",
  compact = false,
}: IWorkspaceSettingsStepProps) {
  const { data: settings, isLoading } = useWorkspaceSettings(workspaceId);
  const updateSettings = useUpdateWorkspaceSettings(workspaceId);
  const toast = useToast();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useFinForm<IWorkspaceSettingsStepForm>({
    resolver: zodResolver(WorkspaceSettingsStepSchema),
    defaultValues: {
      defaultCurrency: getBrowserCurrency(),
      smartTaggingEnabled: true,
      historyLearningEnabled: true,
    },
  });

  useEffect(() => {
    form.reset({
      defaultCurrency: settings?.defaultCurrency ?? getBrowserCurrency(),
      smartTaggingEnabled: settings?.smartTaggingEnabled ?? true,
      historyLearningEnabled: settings?.historyLearningEnabled ?? true,
    });
  }, [settings, form]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const scheduleSave = (patch: Partial<IWorkspaceSettingsStepForm>) => {
    if (workspaceId == null) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      const data = { ...form.getValues(), ...patch };
      try {
        const result = await updateSettings.mutateAsync(data);
        if (isOfflineMutationPlaceholder(result)) {
          return;
        }
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to save workspace settings",
        );
      }
    }, 300);
  };

  if (workspaceId == null || isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {!compact ? (
        <div className="text-center mb-8">
          <Title className="text-3xl mb-4">{title}</Title>
          <Text
            size="lg"
            isMuted
            className="max-w-md mx-auto">
            {description}
          </Text>
        </div>
      ) : null}

      <Form
        form={form}
        onSubmit={() => {}}
        className={
          compact ? "space-y-4" : "space-y-4 max-w-md mx-auto"
        }>
        <CurrencySelect
          name="defaultCurrency"
          label="Default currency"
          clearable={false}
          workspaceId={workspaceId}
          onValueChange={(value) => {
            const currency = Array.isArray(value)
              ? (value[0] ?? null)
              : ((value as ICurrency | undefined) ?? null);
            scheduleSave({ defaultCurrency: currency });
          }}
        />
        <Controller
          name="smartTaggingEnabled"
          control={form.control}
          render={({ field }) => (
            <Checkbox
              label="Enable smart tagging"
              hint="Suggest tags based on rules when creating or importing transactions"
              checked={field.value}
              onChange={(event) => {
                field.onChange(event.target.checked);
                scheduleSave({ smartTaggingEnabled: event.target.checked });
              }}
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
              onChange={(event) => {
                field.onChange(event.target.checked);
                scheduleSave({ historyLearningEnabled: event.target.checked });
              }}
            />
          )}
        />
      </Form>
    </div>
  );
}
