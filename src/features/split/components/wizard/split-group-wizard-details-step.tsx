import type { ISplitGroupFormValues } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitGroupDetailsForm } from "@/features/split/components/split-group-details-form";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";

export interface ISplitGroupWizardDetailsStepProps {
  formId: string;
  initialValues: ISplitGroupFormValues;
  disabled?: boolean;
  createError?: string | null;
  onValuesChange: (values: ISplitGroupFormValues) => void;
  onSubmit: (values: ISplitGroupFormValues) => void;
}

export function SplitGroupWizardDetailsStep({
  formId,
  initialValues,
  disabled,
  createError,
  onValuesChange,
  onSubmit,
}: ISplitGroupWizardDetailsStepProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <Title className="text-3xl mb-4">Group details</Title>
        <Text
          size="lg"
          isMuted
          className="max-w-md mx-auto">
          Name the group and pick the balance currency — the unit you settle in.
          Expenses can still use other currencies.
        </Text>
      </div>
      <div className="max-w-md mx-auto space-y-4">
        {createError ? (
          <div className="p-4 bg-danger/10 border border-danger rounded-2xl">
            <p className="text-danger text-sm">{createError}</p>
          </div>
        ) : null}
        <SplitGroupDetailsForm
          formId={formId}
          initialValues={initialValues}
          canChangeCurrency
          isEditMode={false}
          disabled={disabled}
          currencyHint="Settlement currency for this group. Locked after the first expense."
          onValuesChange={onValuesChange}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
