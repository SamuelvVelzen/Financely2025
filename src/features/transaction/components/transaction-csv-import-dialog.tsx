"use client";

import type {
  ICreateTransactionInput,
  ICsvCandidateTransaction,
  ICsvFieldMapping,
  ICurrency,
} from "@/features/shared/validation/schemas";
import { getCurrencyOptions } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import {
  MultiStepDialog,
  type IStepConfig,
  type IStepNavigation,
} from "@/features/ui/dialog/multi-step-dialog";
import { Form } from "@/features/ui/form/form";
import { FileUploadInput } from "@/features/ui/input/file-upload-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { SelectableTable } from "@/features/ui/table/selectable-table";
import { TableRow } from "@/features/ui/table/table-row";
import { cn } from "@/util/cn";
import { DateFormatHelpers } from "@/util/date/date-format.helpers";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { HiExclamationCircle } from "react-icons/hi";
import type { BankEnum } from "../config/banks";
import {
  TRANSACTION_FIELDS,
  isRequiredField,
} from "../config/transaction-fields";
import {
  useGetCsvMapping,
  useImportCsvTransactions,
  useParseCsvRows,
  useUploadCsvFile,
  useValidateCsvMapping,
} from "../hooks/useCsvImport";
import { getDefaultStrategyForBank } from "../services/csv-type-detection";
import { BankSelect } from "./bank-select";
import { CsvRowErrorDialog } from "./csv-row-error-dialog";

interface ICsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type IStep = "upload" | "mapping" | "review" | "confirm";

export function TransactionCsvImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ICsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ICsvFieldMapping>({});
  const [candidates, setCandidates] = useState<ICsvCandidateTransaction[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [parseResponse, setParseResponse] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<BankEnum | null>(null);
  const [currentStep, setCurrentStep] = useState<IStep>("upload");
  const [errorDialogRowIndex, setErrorDialogRowIndex] = useState<number | null>(
    null
  );

  // Derive strategy from bank selection
  const typeDetectionStrategy = getDefaultStrategyForBank(selectedBank);
  // Form for mapping step controls
  type MappingFormData = {
    defaultCurrency: ICurrency;
    mappings: Record<string, string>;
  };
  const mappingForm = useForm<MappingFormData>({
    defaultValues: {
      defaultCurrency: "EUR",
      mappings: {},
    },
  });
  const { isDirty: mappingFormDirty } = mappingForm.formState;
  const defaultCurrency = mappingForm.watch("defaultCurrency");

  const uploadMutation = useUploadCsvFile();
  const mappingQuery = useGetCsvMapping(
    columns.length > 0 ? columns : undefined,
    selectedBank
  );
  const validateMutation = useValidateCsvMapping();
  const parseQuery = useParseCsvRows(
    file,
    mapping,
    currentPage,
    50,
    typeDetectionStrategy,
    defaultCurrency,
    selectedBank,
    currentStep === "review" // Only enable parsing when on review step
  );
  const importMutation = useImportCsvTransactions();
  const isBusy =
    uploadMutation.isPending ||
    validateMutation.isPending ||
    importMutation.isPending;

  const resetAllState = () => {
    setFile(null);
    setColumns([]);
    setMapping({});
    setCandidates([]);
    setSelectedRows(new Set());
    setCurrentPage(1);
    setParseResponse(null);
    setSelectedBank(null);
    setErrorDialogRowIndex(null);
    mappingForm.reset({
      defaultCurrency: "EUR",
      mappings: {},
    });
  };

  const hasUnsavedChanges = useMemo(() => {
    const mappingHasValues = Object.values(mapping).some(Boolean);
    return (
      file !== null ||
      columns.length > 0 ||
      mappingHasValues ||
      candidates.length > 0 ||
      selectedRows.size > 0 ||
      currentPage !== 1 ||
      selectedBank !== null ||
      mappingFormDirty
    );
  }, [
    file,
    columns,
    mapping,
    candidates,
    selectedRows,
    currentPage,
    selectedBank,
    mappingFormDirty,
  ]);

  const suggestedMapping = mappingQuery.data?.mapping;
  const mappingMetadata = mappingQuery.data?.metadata;

  // Auto-detect mapping when columns are available or bank changes
  useEffect(() => {
    if (columns.length > 0 && suggestedMapping) {
      setMapping(suggestedMapping);
      // Also update form
      const formMappings: Record<string, string> = {};
      Object.entries(suggestedMapping).forEach(([field, column]) => {
        if (column) formMappings[field] = column;
      });
      mappingForm.setValue("mappings", formMappings);
    }
  }, [columns, suggestedMapping, mappingForm, selectedBank]);

  // Load candidates when parse query succeeds
  useEffect(() => {
    if (parseQuery.data) {
      // Ensure defaultCurrency is set in all candidates if provided
      const candidatesWithDefaults = parseQuery.data.candidates.map((c) => {
        const updatedData = { ...c.data };
        if (defaultCurrency && !c.data.currency) {
          updatedData.currency = defaultCurrency;
        }
        return {
          ...c,
          data: updatedData,
        };
      });
      setCandidates(candidatesWithDefaults);
      setParseResponse(parseQuery.data);
      // Auto-select all valid rows
      const validIndices = candidatesWithDefaults
        .filter((c) => c.status === "valid")
        .map((c) => c.rowIndex);
      setSelectedRows(new Set(validIndices));
    }
  }, [parseQuery.data, defaultCurrency]);

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null);
      return;
    }

    setFile(nextFile);
  };

  const handleMappingChange = (field: string, column: string | null) => {
    setMapping((prev) => ({
      ...prev,
      [field]: column,
    }));
    // Also update form for SelectDropdown
    mappingForm.setValue(`mappings.${field}`, column || "");
  };

  // Sync form mapping values back to mapping state
  useEffect(() => {
    const subscription = mappingForm.watch((value, { name }) => {
      if (name?.startsWith("mappings.")) {
        const field = name.replace("mappings.", "");
        const column = value.mappings?.[field] || null;
        if (mapping[field] !== column) {
          setMapping((prev) => ({
            ...prev,
            [field]: column,
          }));
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [mappingForm, mapping]);

  const handleValidateMapping = async (goToStep: (step: IStep) => void) => {
    try {
      const result = await validateMutation.mutateAsync({
        mapping,
        typeDetectionStrategy,
        defaultCurrency,
        bank: selectedBank || undefined,
      });
      if (result.valid) {
        goToStep("review");
      } else {
        alert(`Missing required fields: ${result.missingFields.join(", ")}`);
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleSelectAllValid = () => {
    const validIndices = candidates
      .filter((c) => c.status === "valid")
      .map((c) => c.rowIndex);
    setSelectedRows(new Set(validIndices));
  };

  const handleExcludeAllInvalid = () => {
    const validIndices = candidates
      .filter((c) => c.status === "valid")
      .map((c) => c.rowIndex);
    setSelectedRows(new Set(validIndices));
  };

  // handleEditField is no longer needed - form handles it

  const handleConfirmImport = async () => {
    const transactionsToImport: ICreateTransactionInput[] = [];

    for (const rowIndex of selectedRows) {
      const candidate = candidates.find((c) => c.rowIndex === rowIndex);
      if (
        !candidate ||
        !candidate.data.type ||
        !candidate.data.amount ||
        !candidate.data.occurredAt ||
        !candidate.data.name
      ) {
        continue; // Skip invalid candidates
      }

      const transaction: ICreateTransactionInput = {
        ...candidate.data,
        type: candidate.data.type,
        currency: candidate.data.currency || defaultCurrency || "EUR",
        amount: candidate.data.amount,
        occurredAt: candidate.data.occurredAt,
        name: candidate.data.name,
        tagIds: candidate.data.tagIds || [],
      };

      transactionsToImport.push(transaction);
    }

    try {
      await importMutation.mutateAsync(transactionsToImport);
      onSuccess?.();
      resetAllState();
      onOpenChange(false);
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const renderUploadStep = (navigation: IStepNavigation<IStep>) => (
    <div className="space-y-4">
      <div>
        <FileUploadInput
          label="Select CSV File"
          accept=".csv"
          files={file}
          onFilesChange={handleFileChange}
        />
      </div>
      <div>
        <BankSelect
          value={selectedBank}
          onChange={setSelectedBank}
          helperText="Selecting a bank applies tailored column defaults during mapping."
        />
      </div>
      {uploadMutation.isError && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg">
          <p className="text-sm text-danger">
            {uploadMutation.error?.message || "Upload failed"}
          </p>
        </div>
      )}
    </div>
  );

  const renderMappingStep = (navigation: IStepNavigation<IStep>) => {
    // Filter out currency field (handled separately)
    const fieldsToShow = TRANSACTION_FIELDS.filter(
      (f) => f.name !== "currency"
    );

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
        <Form
          form={mappingForm}
          onSubmit={() => {}}>
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Currency <span className="text-danger ml-1">*</span>
            </label>
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

            const currentValue = mapping[field.name] || "";

            return (
              <div
                key={field.name}
                className="space-y-1">
                <label className="block text-sm font-medium">
                  {field.label}
                  {isRequiredField(field.name) &&
                    !(
                      field.name === "type" && typeDetectionStrategy !== "ing"
                    ) && <span className="text-danger ml-1">*</span>}
                  {field.name === "type" && typeDetectionStrategy === "ing" && (
                    <span className="text-danger ml-1">*</span>
                  )}
                </label>
                {field.name === "type" &&
                  typeDetectionStrategy === "ing" &&
                  field.description && (
                    <p className="text-xs text-text-muted">
                      {field.description} (Required for ING: map to debit/credit
                      column)
                    </p>
                  )}
                <Form
                  form={mappingForm}
                  onSubmit={() => {}}>
                  <SelectDropdown
                    name={`mappings.${field.name}`}
                    options={columnOptions}
                    placeholder="Select column..."
                    multiple={false}
                  />
                </Form>
                {field.description && (
                  <p className="text-xs text-text-muted">{field.description}</p>
                )}
              </div>
            );
          })}
        </div>
        {validateMutation.isError && (
          <div className="p-3 bg-danger/10 border border-danger rounded-lg">
            <p className="text-sm text-danger">
              {validateMutation.error?.message || "Validation failed"}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderReviewStep = (navigation: IStepNavigation<IStep>) => {
    if (parseQuery.isLoading) {
      return <div className="text-center py-8">Parsing CSV...</div>;
    }

    if (parseQuery.isError) {
      return (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg">
          <p className="text-sm text-danger">
            {parseQuery.error?.message || "Failed to parse CSV"}
          </p>
        </div>
      );
    }

    if (candidates.length === 0) {
      return <div className="text-center py-8">No transactions found</div>;
    }

    // Find the candidate for the error dialog
    const errorDialogCandidate =
      errorDialogRowIndex !== null
        ? candidates.find((c) => c.rowIndex === errorDialogRowIndex)
        : null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            Showing {candidates.length} of {parseResponse?.total || 0}{" "}
            transactions ({parseResponse?.totalValid || 0} valid,{" "}
            {parseResponse?.totalInvalid || 0} invalid)
          </div>
          <div className="flex gap-2">
            <Button
              clicked={handleSelectAllValid}
              buttonContent="Select All Valid"
              className="px-3 py-1 text-sm"
            />
            <Button
              clicked={handleExcludeAllInvalid}
              buttonContent="Exclude Invalid"
              className="px-3 py-1 text-sm"
            />
          </div>
        </div>

        <SelectableTable
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          rowCount={candidates.length}
          getRowIndex={(row) => {
            const props = row.props as { rowIndex?: number };
            return props.rowIndex ?? -1;
          }}
          headerCells={[
            <HeaderCell align="left">Status</HeaderCell>,
            <HeaderCell align="left">Date</HeaderCell>,
            <HeaderCell align="left">Name</HeaderCell>,
            <HeaderCell align="left">Amount</HeaderCell>,
            <HeaderCell align="left">Currency</HeaderCell>,
            <HeaderCell align="left">Type</HeaderCell>,
            <HeaderCell align="left">Errors</HeaderCell>,
          ]}>
          {candidates.map((candidate) => {
            return (
              <TableRow
                key={candidate.rowIndex}
                rowIndex={candidate.rowIndex}
                className={cn(
                  "border-t border-border",
                  candidate.status === "invalid" && "bg-danger/5"
                )}>
                <BodyCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs",
                      candidate.status === "valid" &&
                        "bg-success/20 text-success",
                      candidate.status === "invalid" &&
                        "bg-danger/20 text-danger"
                    )}>
                    {candidate.status}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-sm text-text-muted">
                    {candidate.data.occurredAt
                      ? DateFormatHelpers.formatIsoStringToString(
                          candidate.data.occurredAt
                        )
                      : "—"}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-sm text-text">
                    {candidate.data.name || "—"}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-sm text-text">
                    {candidate.data.amount || "—"}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-sm font-medium">
                    {candidate.data.currency || defaultCurrency}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-sm font-medium">
                    {candidate.data.type || "—"}
                  </span>
                </BodyCell>
                <BodyCell>
                  {candidate.errors.length > 0 ? (
                    <Button
                      clicked={() => setErrorDialogRowIndex(candidate.rowIndex)}
                      buttonContent={
                        <div className="flex items-center gap-2">
                          <HiExclamationCircle className="w-4 h-4 text-danger" />
                          <span className="text-sm text-danger">
                            {candidate.errors.length} error
                            {candidate.errors.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      }
                      className="px-2 py-1 text-sm border-0 bg-transparent hover:bg-danger/10"
                      variant="default"
                    />
                  ) : (
                    <span className="text-sm text-text-muted">—</span>
                  )}
                </BodyCell>
              </TableRow>
            );
          })}
        </SelectableTable>

        {/* Error Dialog */}
        <CsvRowErrorDialog
          candidate={errorDialogCandidate ?? null}
          open={errorDialogRowIndex !== null}
          onOpenChange={(open) => {
            if (!open) {
              setErrorDialogRowIndex(null);
            }
          }}
        />

        {parseResponse?.hasNext && (
          <div className="flex justify-center gap-2">
            <Button
              clicked={() => {
                if (currentPage > 1) {
                  setCurrentPage((p) => p - 1);
                }
              }}
              buttonContent="Previous"
              className={cn(
                "px-4 py-2",
                currentPage === 1 && "opacity-50 cursor-not-allowed"
              )}
            />
            <span className="px-4 py-2 text-sm">
              Page {currentPage} of{" "}
              {Math.ceil((parseResponse?.total || 0) / 50)}
            </span>
            <Button
              clicked={() => {
                if (parseResponse?.hasNext) {
                  setCurrentPage((p) => p + 1);
                }
              }}
              buttonContent="Next"
              className={cn(
                "px-4 py-2",
                !parseResponse?.hasNext && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>
        )}
      </div>
    );
  };

  const renderConfirmStep = (navigation: IStepNavigation<IStep>) => {
    const selectedCount = selectedRows.size;
    const totalCount = candidates.length;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-surface-hover rounded-lg">
          <p className="text-sm font-medium mb-2">Import Summary</p>
          <p className="text-sm">
            You are about to import <strong>{selectedCount}</strong> of{" "}
            <strong>{totalCount}</strong> transactions.
          </p>
        </div>
        {importMutation.isError && (
          <div className="p-3 bg-danger/10 border border-danger rounded-lg">
            <p className="text-sm text-danger">
              {importMutation.error?.message || "Import failed"}
            </p>
          </div>
        )}
      </div>
    );
  };

  const steps: Record<IStep, IStepConfig<IStep>> = {
    upload: {
      title: "Upload CSV File",
      size: "lg" as const,
      content: renderUploadStep,
      footerButtons: (navigation: IStepNavigation<IStep>) => [
        {
          clicked: () => {
            if (!file) {
              return;
            }

            uploadMutation
              .mutateAsync(file)
              .then((result) => {
                setColumns(result.columns);
                navigation.goToStep("mapping");
              })
              .catch((error) => {
                console.error("Upload failed:", error);
              });
          },
          disabled: !file,
          variant: "primary",
          buttonContent: "Next",
        },
      ],
    },
    mapping: {
      title: "Map Fields",
      size: "full" as const,
      content: renderMappingStep,
      footerButtons: (navigation: IStepNavigation<IStep>) => [
        {
          clicked: () => navigation.goToStep("upload"),
          buttonContent: "Back",
        },
        {
          clicked: () => {
            if (!validateMutation.isPending) {
              handleValidateMapping(navigation.goToStep);
            }
          },
          variant: "primary" as const,
          disabled: validateMutation.isPending,
          buttonContent: validateMutation.isPending
            ? "Validating..."
            : "Continue",
        },
      ],
    },
    review: {
      title: "Review Transactions",
      size: "full" as const,
      content: renderReviewStep,
      footerButtons: (navigation: IStepNavigation<IStep>) => [
        {
          clicked: () => navigation.goToStep("mapping"),
          buttonContent: "Back",
        },
        {
          clicked: () => {
            if (selectedRows.size > 0) {
              navigation.goToStep("confirm");
            }
          },
          variant: "primary" as const,
          disabled: selectedRows.size === 0,
          buttonContent: "Continue to Import",
        },
      ],
    },
    confirm: {
      title: "Confirm Import",
      size: "lg" as const,
      content: renderConfirmStep,
      footerButtons: (navigation: IStepNavigation<IStep>) => [
        {
          clicked: () => navigation.goToStep("review"),
          buttonContent: "Back",
        },
        {
          clicked: () => {
            if (!importMutation.isPending && selectedRows.size > 0) {
              handleConfirmImport();
            }
          },
          variant: "primary" as const,
          disabled: importMutation.isPending || selectedRows.size === 0,
          buttonContent: importMutation.isPending
            ? "Importing..."
            : "Confirm Import",
        },
      ],
    },
  };

  return (
    <MultiStepDialog
      steps={steps}
      initialStep="upload"
      open={open}
      onOpenChange={onOpenChange}
      hasUnsavedChanges={() => hasUnsavedChanges}
      onReset={resetAllState}
      isBusy={isBusy}
      onStepChange={(_, nextStep) => {
        setCurrentStep(nextStep);
      }}
    />
  );
}
