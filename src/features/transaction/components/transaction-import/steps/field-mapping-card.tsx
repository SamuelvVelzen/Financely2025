import { LinkButton } from "@/features/ui/button/link-button";
import { Form } from "@/features/ui/form/form";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Label } from "@/features/ui/typography/label";
import type { ITransactionFieldMetadata } from "../../../config/transaction-fields";
import { useTransactionImportContext } from "./transaction-import-context";

type IFieldMappingCardProps = {
  field: ITransactionFieldMetadata;
  isRequired: boolean;
  showTypeHint: boolean;
};

export function FieldMappingCard({
  field,
  isRequired,
  showTypeHint,
}: IFieldMappingCardProps) {
  const {
    mappingForm,
    columns,
    mapping,
    suggestedMapping,
    handleResetToSuggested,
    handleMappingFieldChange,
  } = useTransactionImportContext();

  const columnOptions = [
    { value: "", label: "— Not mapped —" },
    ...columns.map((col) => ({ value: col, label: col })),
  ];
  const suggestedColumn = suggestedMapping?.[field.name];
  const hasSuggestedMapping = !!suggestedColumn;
  const currentValue = mapping[field.name] || "";
  const isDifferentFromSuggested = currentValue !== suggestedColumn;
  const fieldError = mappingForm.formState.errors.mappings?.[field.name];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label
          required={isRequired}
          className="text-sm">
          {field.label}
        </Label>
        {hasSuggestedMapping && isDifferentFromSuggested && (
          <LinkButton
            clicked={() => handleResetToSuggested(field.name)}
            buttonContent="Reset"
            className="text-xs"
          />
        )}
      </div>
      <Form
        form={mappingForm}
        onSubmit={() => {}}>
        <SelectDropdown
          name={`mappings.${field.name}`}
          options={columnOptions}
          placeholder="Select column..."
          multiple={false}
          clearable={false}
          onValueChange={(value) => {
            const column = (value as string) || null;
            handleMappingFieldChange(field.name, column);
          }}
        />
      </Form>
      {fieldError && (
        <p className="text-xs text-danger">{fieldError.message}</p>
      )}
      {showTypeHint && (
        <p className="text-xs text-info">Map to debit/credit column</p>
      )}
    </div>
  );
}
