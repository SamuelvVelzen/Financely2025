import { getCurrencyOptions } from "@/features/shared/validation/schemas";
import { Accordion } from "@/features/ui/accordion/accordion";
import { Alert } from "@/features/ui/alert/alert";
import { LinkButton } from "@/features/ui/button/link-button";
import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { Form } from "@/features/ui/form/form";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Label } from "@/features/ui/typography/label";
import {
  TRANSACTION_FIELDS,
  type ITransactionFieldMetadata,
} from "../../../config/transaction-fields";
import {
  hasDescriptionExtraction,
  supportsDateTimeExtraction,
} from "../../../services/csv-description-extraction";
import { BankSelect } from "../../bank-select";
import {
  useTransactionImportContext,
  type IStep,
} from "./transaction-import-context";

interface IFieldMappingCardProps {
  field: ITransactionFieldMetadata;
  isRequired: boolean;
  showTypeHint: boolean;
}

function FieldMappingCard({
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
          showClearButton={false}
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

function MappingStepContent() {
  const {
    selectedBank,
    setSelectedBank,
    mappingForm,
    requiredMappingFields,
    transformMutation,
  } = useTransactionImportContext();

  const requiredFields = TRANSACTION_FIELDS.filter((f) =>
    requiredMappingFields.includes(f.name)
  );
  const optionalFields = TRANSACTION_FIELDS.filter(
    (f) => !requiredMappingFields.includes(f.name)
  );

  const bankDisplayName =
    selectedBank === "AMERICAN_EXPRESS"
      ? "American Express"
      : selectedBank === "ING"
        ? "ING"
        : selectedBank === "N26"
          ? "N26"
          : null;

  return (
    <div className="space-y-6">
      {/* Header: Bank & Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BankSelect
          value={selectedBank}
          onChange={setSelectedBank}
          helperText="Auto-detects columns and type strategy"
        />
        <Form
          form={mappingForm}
          onSubmit={() => {}}>
          <div className="space-y-1.5">
            <Label
              required
              className="text-sm">
              Currency
            </Label>
            <SelectDropdown
              name="defaultCurrency"
              options={getCurrencyOptions()}
              placeholder="Select currency..."
              multiple={false}
            />
          </div>
        </Form>
      </div>

      {/* Bank Strategy Info */}
      {selectedBank && (
        <Alert variant="primary">
          Using{" "}
          <span className="text-primary font-medium">{bankDisplayName}</span>{" "}
          detection strategy
          {requiredMappingFields.includes("type") && (
            <> — requires Type column (debit/credit)</>
          )}
        </Alert>
      )}

      {/* Data Enhancement Strategies Notification */}
      {(() => {
        const hasDescriptionExtractionStrategy =
          hasDescriptionExtraction(selectedBank);
        const hasDateTimeExtractionStrategy =
          supportsDateTimeExtraction(selectedBank);

        if (
          !hasDescriptionExtractionStrategy &&
          !hasDateTimeExtractionStrategy
        ) {
          return null;
        }

        return (
          <Alert
            variant="primary"
            title="Automatic Data Enhancement">
            <div className="space-y-1.5">
              {hasDescriptionExtractionStrategy && (
                <p>
                  <strong>Description extraction:</strong> Descriptions are
                  being automatically extracted and enhanced from your CSV data.
                  Transaction names may be combined with descriptions when
                  available.
                </p>
              )}
              {hasDateTimeExtractionStrategy && (
                <p>
                  <strong>Date/time extraction:</strong> More precise
                  transaction dates and times are being extracted from
                  notification fields when available. These will override the
                  main date field for better accuracy.
                </p>
              )}
            </div>
          </Alert>
        );
      })()}

      {/* Field Mappings */}
      <div className="space-y-4">
        {/* Required Fields */}
        <Accordion
          title="Required Fields"
          defaultOpen>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {requiredFields.map((field) => (
              <FieldMappingCard
                key={field.name}
                field={field}
                isRequired={true}
                showTypeHint={field.name === "type" && selectedBank === "ING"}
              />
            ))}
          </div>
        </Accordion>

        {/* Optional Fields */}
        {optionalFields.length > 0 && (
          <Accordion
            title="Optional Fields"
            defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {optionalFields.map((field) => (
                <FieldMappingCard
                  key={field.name}
                  field={field}
                  isRequired={false}
                  showTypeHint={false}
                />
              ))}
            </div>
          </Accordion>
        )}
      </div>

      {/* Error Display */}
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
    size: "3/4",
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
