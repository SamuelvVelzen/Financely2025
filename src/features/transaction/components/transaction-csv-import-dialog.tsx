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
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { BankSelect } from "./bank-select";

interface ICsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultType?: "EXPENSE" | "INCOME";
}

type IStep = "upload" | "mapping" | "review" | "confirm";

export function TransactionCsvImportDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultType,
}: ICsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ICsvFieldMapping>({});
  const [candidates, setCandidates] = useState<ICsvCandidateTransaction[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [parseResponse, setParseResponse] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<BankEnum | null>(null);

  // Form for mapping step controls
  type MappingFormData = {
    typeDetectionStrategy: string;
    defaultCurrency: ICurrency;
    mappings: Record<string, string>;
  };
  const mappingForm = useForm<MappingFormData>({
    defaultValues: {
      typeDetectionStrategy: "sign-based",
      defaultCurrency: "EUR",
      mappings: {},
    },
  });
  const { isDirty: mappingFormDirty } = mappingForm.formState;
  const typeDetectionStrategy = mappingForm.watch("typeDetectionStrategy");
  const defaultCurrency = mappingForm.watch("defaultCurrency");

  const uploadMutation = useUploadCsvFile();
  const mappingQuery = useGetCsvMapping(
    columns.length > 0 ? columns : undefined,
    selectedBank
  );
  const validateMutation = useValidateCsvMapping(defaultType);
  const parseQuery = useParseCsvRows(
    file,
    mapping,
    currentPage,
    50,
    defaultType,
    // Only use type detection strategy if defaultType is not provided
    defaultType ? undefined : typeDetectionStrategy,
    defaultCurrency,
    selectedBank
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
    mappingForm.reset({
      typeDetectionStrategy: "sign-based",
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

  // Auto-detect mapping when columns are available
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
  }, [columns, suggestedMapping, mappingForm]);

  // Load candidates when parse query succeeds
  useEffect(() => {
    if (parseQuery.data) {
      // Ensure defaultType and defaultCurrency are set in all candidates if provided
      const candidatesWithDefaults = parseQuery.data.candidates.map((c) => {
        const updatedData = { ...c.data };
        if (defaultType && !c.data.type) {
          updatedData.type = defaultType;
        }
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
  }, [parseQuery.data, defaultType, defaultCurrency]);

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
        defaultType,
        typeDetectionStrategy: defaultType ? undefined : typeDetectionStrategy,
        defaultCurrency,
        bank: selectedBank || undefined,
      });
      if (result.valid) {
        goToStep("review");
        // Trigger parse query with current type detection strategy
        parseQuery.refetch();
      } else {
        alert(`Missing required fields: ${result.missingFields.join(", ")}`);
      }
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  // Re-parse when type detection strategy or currency changes
  useEffect(() => {
    if (parseQuery.data) {
      if (!defaultType && typeDetectionStrategy) {
        parseQuery.refetch();
      } else if (defaultCurrency) {
        parseQuery.refetch();
      }
    }
  }, [typeDetectionStrategy, defaultCurrency, defaultType, parseQuery]);

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
      if (!candidate) continue;

      const transaction: ICreateTransactionInput = {
        ...candidate.data,
        type: defaultType || candidate.data.type || "EXPENSE",
        currency: candidate.data.currency || defaultCurrency,
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
    // Filter out type field if defaultType is provided
    // Filter out currency field (handled separately)
    const fieldsToShow = TRANSACTION_FIELDS.filter(
      (f) => f.name !== "currency" && (defaultType ? f.name !== "type" : true)
    );

    return (
      <div className="space-y-4">
        {defaultType && (
          <div className="p-3 bg-primary/10 border border-primary rounded-lg">
            <p className="text-sm text-primary font-medium">
              Transaction type will be set to: {defaultType}
            </p>
          </div>
        )}
        {mappingMetadata?.propertyOrder && (
          <div className="p-3 bg-surface-hover border border-border rounded-lg">
            <p className="text-xs text-text-muted">
              Bank-specific column order: {mappingMetadata.propertyOrder}
            </p>
          </div>
        )}
        {!defaultType && (
          <Form form={mappingForm} onSubmit={() => {}}>
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Type Detection Strategy
              </label>
              <SelectDropdown
                name="typeDetectionStrategy"
                options={[
                  {
                    value: "sign-based",
                    label:
                      "Sign-based (Default) - Negative = Expense, Positive = Income",
                  },
                  {
                    value: "amex",
                    label:
                      "Amex Format - Negative = Income, Positive = Expense",
                  },
                ]}
                placeholder="Select strategy..."
                multiple={false}
              />
              <p className="text-xs text-text-muted">
                How to determine transaction type when not specified in CSV
              </p>
            </div>
          </Form>
        )}
        <Form form={mappingForm} onSubmit={() => {}}>
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
              <div key={field.name} className="space-y-1">
                <label className="block text-sm font-medium">
                  {field.label}
                  {isRequiredField(field.name) &&
                    !(
                      field.name === "type" &&
                      !defaultType &&
                      typeDetectionStrategy
                    ) && <span className="text-danger ml-1">*</span>}
                </label>
                <Form form={mappingForm} onSubmit={() => {}}>
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

    const formatDate = (isoString: string) => {
      return new Date(isoString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

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
          ]}
        >
          {candidates.map((candidate) => {
            return (
              <TableRow
                key={candidate.rowIndex}
                rowIndex={candidate.rowIndex}
                className={cn(
                  "border-t border-border",
                  candidate.status === "invalid" && "bg-danger/5"
                )}
              >
                <BodyCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs",
                      candidate.status === "valid" &&
                        "bg-success/20 text-success",
                      candidate.status === "invalid" &&
                        "bg-danger/20 text-danger"
                    )}
                  >
                    {candidate.status}
                  </span>
                </BodyCell>
                <BodyCell>
                  <span className="text-sm text-text-muted">
                    {candidate.data.occurredAt
                      ? formatDate(candidate.data.occurredAt)
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
                    {defaultType || candidate.data.type || "—"}
                  </span>
                </BodyCell>
                <BodyCell>
                  {candidate.errors.length > 0 && (
                    <div className="text-xs text-danger">
                      {candidate.errors.map((err, i) => (
                        <div key={i}>
                          {err.field}: {err.message}
                        </div>
                      ))}
                    </div>
                  )}
                </BodyCell>
              </TableRow>
            );
          })}
        </SelectableTable>

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
    />
  );
}
