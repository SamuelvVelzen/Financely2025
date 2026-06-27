import { getCurrencyOptions } from "@/features/shared/validation/schemas";
import { Accordion } from "@/features/ui/accordion/accordion";
import { Alert } from "@/features/ui/alert/alert";
import { Form } from "@/features/ui/form/form";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Label } from "@/features/ui/typography/label";
import {
  TRANSACTION_FIELDS,
} from "../../../config/transaction-fields";
import { BankProfileFactory } from "../../../services/bank.factory";
import {
  hasDescriptionExtraction,
  supportsDateTimeExtraction,
} from "../../../services/csv-description-extraction";
import { BankSelect } from "../../bank-select";
import { FieldMappingCard } from "./field-mapping-card";
import { useTransactionImportContext } from "./transaction-import-context";

export function MappingStepContent() {
  const {
    selectedBank,
    setSelectedBank,
    mappingForm,
    requiredMappingFields,
    transformMutation,
  } = useTransactionImportContext();

  const hiddenFields = BankProfileFactory.getHiddenFields(selectedBank);

  const requiredFields = TRANSACTION_FIELDS.filter(
    (f) =>
      requiredMappingFields.includes(f.name) && !hiddenFields.includes(f.name)
  );
  const optionalFields = TRANSACTION_FIELDS.filter(
    (f) =>
      !requiredMappingFields.includes(f.name) && !hiddenFields.includes(f.name)
  );

  const bankDisplayName =
    selectedBank === "DEFAULT"
      ? "Default"
      : selectedBank === "AMERICAN_EXPRESS"
        ? "American Express"
        : selectedBank === "ING"
          ? "ING"
          : selectedBank === "N26"
            ? "N26"
            : null;

  return (
    <div className="space-y-6">
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

      <div className="space-y-4">
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

      {transformMutation.isError && (
        <div className="p-3 bg-danger/10 border border-danger rounded-2xl">
          <p className="text-sm text-danger">
            {transformMutation.error?.message || "Processing failed"}
          </p>
        </div>
      )}
    </div>
  );
}
