"use client";

import type {
  CreateTransactionInput,
  CsvCandidateTransaction,
  CsvFieldMapping,
  Currency,
} from "@/features/shared/validation/schemas";
import { getCurrencyOptions } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { cn } from "@/util/cn";
import { useEffect, useState } from "react";
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

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultType?: "EXPENSE" | "INCOME";
}

type Step = "upload" | "mapping" | "review" | "confirm";

export function CsvImportDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultType,
}: CsvImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CsvFieldMapping>({});
  const [candidates, setCandidates] = useState<CsvCandidateTransaction[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editedRows, setEditedRows] = useState<
    Record<number, Partial<CreateTransactionInput>>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [parseResponse, setParseResponse] = useState<any>(null);
  const [typeDetectionStrategy, setTypeDetectionStrategy] =
    useState<string>("sign-based");
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>("USD");

  const uploadMutation = useUploadCsvFile();
  const mappingQuery = useGetCsvMapping(
    columns.length > 0 ? columns : undefined
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
    defaultCurrency
  );
  const importMutation = useImportCsvTransactions();

  // Auto-detect mapping when columns are available
  useEffect(() => {
    if (columns.length > 0 && mappingQuery.data) {
      setMapping(mappingQuery.data);
    }
  }, [columns, mappingQuery.data]);

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

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    try {
      const result = await uploadMutation.mutateAsync(selectedFile);
      setColumns(result.columns);
      setStep("mapping");
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleMappingChange = (field: string, column: string | null) => {
    setMapping((prev) => ({
      ...prev,
      [field]: column,
    }));
  };

  const handleValidateMapping = async () => {
    try {
      const result = await validateMutation.mutateAsync({
        mapping,
        defaultType,
        typeDetectionStrategy: defaultType ? undefined : typeDetectionStrategy,
        defaultCurrency,
      });
      if (result.valid) {
        setStep("review");
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
    if (step === "review" && parseQuery.data) {
      if (!defaultType && typeDetectionStrategy) {
        parseQuery.refetch();
      } else if (defaultCurrency) {
        parseQuery.refetch();
      }
    }
  }, [typeDetectionStrategy, defaultCurrency, step, defaultType, parseQuery]);

  const handleRowToggle = (rowIndex: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
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

  const handleEditField = (
    rowIndex: number,
    field: keyof CreateTransactionInput,
    value: any
  ) => {
    setEditedRows((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [field]: value,
      },
    }));
  };

  const handleConfirmImport = async () => {
    const transactionsToImport: CreateTransactionInput[] = [];

    for (const rowIndex of selectedRows) {
      const candidate = candidates.find((c) => c.rowIndex === rowIndex);
      if (!candidate) continue;

      const edited = editedRows[rowIndex] || {};
      const transaction: CreateTransactionInput = {
        ...candidate.data,
        ...edited,
        // Set default type if provided and not already set
        type: defaultType || candidate.data.type || edited.type || "EXPENSE",
        // Ensure currency is set
        currency: edited.currency || candidate.data.currency || defaultCurrency,
      };

      transactionsToImport.push(transaction);
    }

    try {
      await importMutation.mutateAsync(transactionsToImport);
      onSuccess?.();
      onOpenChange(false);
      // Reset state
      setStep("upload");
      setFile(null);
      setColumns([]);
      setMapping({});
      setCandidates([]);
      setSelectedRows(new Set());
      setEditedRows({});
      setCurrentPage(1);
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "upload":
        return "Upload CSV File";
      case "mapping":
        return "Map Fields";
      case "review":
        return "Review Transactions";
      case "confirm":
        return "Confirm Import";
      default:
        return "Import CSV";
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Select CSV File
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="block w-full text-sm text-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
        />
      </div>
      {file && (
        <div className="p-4 bg-surface-hover rounded-lg">
          <p className="text-sm">
            <span className="font-medium">File:</span> {file.name}
          </p>
          <p className="text-sm">
            <span className="font-medium">Size:</span>{" "}
            {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}
      {uploadMutation.isError && (
        <div className="p-3 bg-danger/10 border border-danger rounded-lg">
          <p className="text-sm text-danger">
            {uploadMutation.error?.message || "Upload failed"}
          </p>
        </div>
      )}
    </div>
  );

  const renderMappingStep = () => {
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
        {!defaultType && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Type Detection Strategy
            </label>
            <SelectDropdown
              options={[
                {
                  value: "sign-based",
                  label:
                    "Sign-based (Default) - Negative = Expense, Positive = Income",
                },
                {
                  value: "amex",
                  label: "Amex Format - Negative = Income, Positive = Expense",
                },
              ]}
              value={typeDetectionStrategy}
              onChange={(value) => setTypeDetectionStrategy(value as string)}
              placeholder="Select strategy..."
              multiple={false}
            />
            <p className="text-xs text-text-muted">
              How to determine transaction type when not specified in CSV
            </p>
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Currency <span className="text-danger ml-1">*</span>
          </label>
          <SelectDropdown
            options={getCurrencyOptions()}
            value={defaultCurrency}
            onChange={(value) => setDefaultCurrency(value as Currency)}
            placeholder="Select currency..."
            multiple={false}
          />
          <p className="text-xs text-text-muted">
            Currency for all transactions in this CSV file
          </p>
        </div>
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
                      field.name === "type" &&
                      !defaultType &&
                      typeDetectionStrategy
                    ) && <span className="text-danger ml-1">*</span>}
                </label>
                <SelectDropdown
                  options={columnOptions}
                  value={currentValue}
                  onChange={(value) =>
                    handleMappingChange(field.name, value as string)
                  }
                  placeholder="Select column..."
                  multiple={false}
                />
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

  const renderReviewStep = () => {
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

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-hover">
                <tr>
                  <th className="px-4 py-2 text-left">Include</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Currency</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Errors</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => {
                  const isSelected = selectedRows.has(candidate.rowIndex);
                  const edited = editedRows[candidate.rowIndex] || {};
                  const transaction = { ...candidate.data, ...edited };

                  return (
                    <tr
                      key={candidate.rowIndex}
                      className={cn(
                        "border-t border-border",
                        candidate.status === "invalid" && "bg-danger/5"
                      )}>
                      <td className="px-4 py-2">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleRowToggle(candidate.rowIndex)}
                        />
                      </td>
                      <td className="px-4 py-2">
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
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={
                            transaction.occurredAt
                              ? new Date(transaction.occurredAt)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleEditField(
                              candidate.rowIndex,
                              "occurredAt",
                              e.target.value
                                ? new Date(e.target.value).toISOString()
                                : ""
                            )
                          }
                          className="w-full px-2 py-1 border border-border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={transaction.name || ""}
                          onChange={(e) =>
                            handleEditField(
                              candidate.rowIndex,
                              "name",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={transaction.amount || ""}
                          onChange={(e) =>
                            handleEditField(
                              candidate.rowIndex,
                              "amount",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-border rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-sm font-medium">
                          {transaction.currency || defaultCurrency}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {defaultType ? (
                          <span className="text-sm font-medium">
                            {defaultType}
                          </span>
                        ) : (
                          <select
                            value={transaction.type || ""}
                            onChange={(e) =>
                              handleEditField(
                                candidate.rowIndex,
                                "type",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 border border-border rounded text-sm">
                            <option value="EXPENSE">Expense</option>
                            <option value="INCOME">Income</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {candidate.errors.length > 0 && (
                          <div className="text-xs text-danger">
                            {candidate.errors.map((err, i) => (
                              <div key={i}>
                                {err.field}: {err.message}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

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

  const renderConfirmStep = () => {
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

  const renderStepContent = () => {
    switch (step) {
      case "upload":
        return renderUploadStep();
      case "mapping":
        return renderMappingStep();
      case "review":
        return renderReviewStep();
      case "confirm":
        return renderConfirmStep();
      default:
        return null;
    }
  };

  const getFooterButtons = () => {
    const buttons = [];

    if (step !== "upload") {
      buttons.push({
        clicked: () => {
          if (step === "mapping") {
            setStep("upload");
          } else if (step === "review") {
            setStep("mapping");
          } else if (step === "confirm") {
            setStep("review");
          }
        },
        className:
          "px-4 py-2 border border-border rounded-lg hover:bg-surface-hover motion-safe:transition-colors",
        buttonContent: "Back",
      });
    }

    if (step === "mapping") {
      buttons.push({
        clicked: () => {
          if (!validateMutation.isPending) {
            handleValidateMapping();
          }
        },
        className: cn(
          "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors",
          validateMutation.isPending && "opacity-50 cursor-not-allowed"
        ),
        buttonContent: validateMutation.isPending
          ? "Validating..."
          : "Continue",
      });
    } else if (step === "review") {
      buttons.push({
        clicked: () => {
          if (selectedRows.size > 0) {
            setStep("confirm");
          }
        },
        className: cn(
          "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors",
          selectedRows.size === 0 && "opacity-50 cursor-not-allowed"
        ),
        buttonContent: "Continue to Import",
      });
    } else if (step === "confirm") {
      buttons.push({
        clicked: () => {
          console.log(importMutation.isPending, selectedRows.size);
          if (!importMutation.isPending && selectedRows.size > 0) {
            handleConfirmImport();
          }
        },
        className: cn(
          "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors",
          (importMutation.isPending || selectedRows.size === 0) &&
            "opacity-50 cursor-not-allowed"
        ),
        buttonContent: importMutation.isPending
          ? "Importing..."
          : "Confirm Import",
      });
    } else {
      buttons.push({
        clicked: () => onOpenChange(false),
        className:
          "px-4 py-2 border border-border rounded-lg hover:bg-surface-hover motion-safe:transition-colors",
        buttonContent: "Close",
      });
    }

    return buttons;
  };

  return (
    <Dialog
      title={getStepTitle()}
      content={renderStepContent()}
      footerButtons={getFooterButtons()}
      open={open}
      onOpenChange={onOpenChange}
      variant="modal"
      size="lg"
      dismissible={false}
    />
  );
}
