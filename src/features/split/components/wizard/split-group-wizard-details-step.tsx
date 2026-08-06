import type { ISplitGroupFormValues } from "@/features/split/components/add-or-edit-split-group-dialog-shared";
import { SplitGroupDetailsForm } from "@/features/split/components/split-group-details-form";
import { Text } from "@/features/ui/typography/text";
import { Title } from "@/features/ui/typography/title";

export interface ISplitGroupWizardDetailsStepProps {
  formId: string;
  initialValues: ISplitGroupFormValues;
  disabled?: boolean;
  onValuesChange: (values: ISplitGroupFormValues) => void;
  onSubmit: (values: ISplitGroupFormValues) => void;
}

export function SplitGroupWizardDetailsStep({
  formId,
  initialValues,
  disabled,
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
      <div className="max-w-md mx-auto">
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
