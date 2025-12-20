import { getCurrencyOptions } from "@/features/shared/validation/schemas";
import { LinkButton } from "@/features/ui/button/link-button";
import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { Form } from "@/features/ui/form/form";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Label } from "@/features/ui/typography/label";
import { TRANSACTION_FIELDS } from "../../../config/transaction-fields";
import { BankSelect } from "../../bank-select";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

function MappingStepContent() {
  const {
    selectedBank,
    setSelectedBank,
    mappingForm,
    columns,
    mapping,
    suggestedMapping,
    handleResetToSuggested,
    requiredMappingFields,
    transformMutation,
  } = useTransactionImportContext();

  const fieldsToShow = TRANSACTION_FIELDS;

  return (
    <div className="space-y-4">
      <div>
        <BankSelect
          value={selectedBank}
          onChange={setSelectedBank}
          helperText="Selecting a bank applies tailored column defaults and type detection strategy."
        />
      </div>
      {selectedBank && (
        <div className="p-3 bg-primary/10 border border-primary rounded-lg">
          <p className="text-sm text-primary font-medium">
            Using{" "}
            {selectedBank === "AMERICAN_EXPRESS"
              ? "Amex"
              : selectedBank === "ING"
                ? "ING"
                : selectedBank}{" "}
            type detection strategy
          </p>
        </div>
      )}
      {selectedBank === "ING" && (
        <div className="p-3 bg-info/10 border border-info rounded-lg">
          <p className="text-sm text-info font-medium mb-1">
            ING Strategy: Type Column Required
          </p>
          <p className="text-xs text-text-muted">
            The "Type" field must be mapped to a column containing "debit" or
            "credit" values. "Debit" = Expense, "Credit" = Income.
          </p>
        </div>
      )}
      <Form form={mappingForm} onSubmit={() => {}}>
        <div className="space-y-2">
          <Label required>Currency</Label>
          <SelectDropdown
            name="defaultCurrency"
            options={getCurrencyOptions()}
            placeholder="Select currency..."
            multiple={false}
          />
          <p className="text-xs text-text-muted">
            Currency for all transactions in this CSV file
          </p>
        </div>
      </Form>
      <p className="text-sm text-text-muted">
        Map CSV columns to transaction fields. Required fields are marked with
        an asterisk (*).
      </p>
      <div className="space-y-3">
        {fieldsToShow.map((field) => {
          const columnOptions = [
            { value: "", label: "— Not mapped —" },
            ...columns.map((col) => ({ value: col, label: col })),
          ];
          const suggestedColumn = suggestedMapping?.[field.name];
          const hasSuggestedMapping = !!suggestedColumn;
          const currentValue = mapping[field.name] || "";
          const isDifferentFromSuggested = currentValue !== suggestedColumn;

          const isRequired = requiredMappingFields.includes(field.name);
          const fieldError =
            mappingForm.formState.errors.mappings?.[field.name];

          return (
            <div key={field.name} className="space-y-1">
              <Label required={isRequired}>{field.label}</Label>
              {field.name === "type" && isRequired && field.description && (
                <p className="text-xs text-text-muted">
                  {field.description} (Required: map to debit/credit column)
                </p>
              )}
              <Form form={mappingForm} onSubmit={() => {}}>
                <SelectDropdown
                  name={`mappings.${field.name}`}
                  options={columnOptions}
                  placeholder="Select column..."
                  multiple={false}
                  showClearButton={false}
                />
              </Form>
              {fieldError && (
                <p className="text-xs text-danger">{fieldError.message}</p>
              )}
              {hasSuggestedMapping && isDifferentFromSuggested && (
                <LinkButton
                  clicked={() => handleResetToSuggested(field.name)}
                  buttonContent={`Reset to auto detected colomn: ${suggestedColumn}`}
                  className="text-xs mt-1"
                />
              )}
              {field.description && !(field.name === "type" && isRequired) && (
                <p className="text-xs text-text-muted">{field.description}</p>
              )}
            </div>
          );
        })}
      </div>
      {transformMutation.isError && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg">
          <p className="text-sm text-danger">
            {transformMutation.error?.message || "Processing failed"}
          </p>
        </div>
      )}
    </div>
  );
}

export function useMappingStep(): IStepConfig<IStep> {
  const ctx = useTransactionImportContext();

  return {
    title: "Map Fields",
    size: "full",
    content: () => <MappingStepContent />,
    footerButtons: (navigation: IStepNavigation<IStep>) => [
      {
        clicked: () => navigation.goToStep("upload"),
        buttonContent: "Back",
      },
      {
        clicked: () => {
          // Trigger form validation, then call handleValidateMapping if valid
          ctx.mappingForm.handleSubmit(() => {
            ctx.handleValidateMapping(navigation.goToStep);
          })();
        },
        variant: "primary",
        disabled: ctx.transformMutation.isPending,
        buttonContent: ctx.transformMutation.isPending
          ? "Processing..."
          : "Continue",
      },
    ],
  };
}
