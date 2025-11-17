"use client";

import type {
  ICreateTransactionInput,
  ICsvCandidateTransaction,
  ICsvFieldMapping,
  ICurrency,
} from "@/features/shared/validation/schemas";
import { getCurrencyOptions } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { IconButton } from "@/features/ui/button/icon-button";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { IDialogProps } from "@/features/ui/dialog/dialog/types";
import { TableInput } from "@/features/ui/input/table-input";
import { TableSelect } from "@/features/ui/input/table-select";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { SelectableTable } from "@/features/ui/table/selectable-table";
import { TableRow } from "@/features/ui/table/table-row";
import { cn } from "@/util/cn";
import { useEffect, useState } from "react";
import { HiX } from "react-icons/hi";
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
  const [step, setStep] = useState<IStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ICsvFieldMapping>({});
  const [candidates, setCandidates] = useState<ICsvCandidateTransaction[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editedRows, setEditedRows] = useState<
    Record<number, Partial<ICreateTransactionInput>>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [parseResponse, setParseResponse] = useState<any>(null);
  const [typeDetectionStrategy, setTypeDetectionStrategy] =
    useState<string>("sign-based");
  const [defaultCurrency, setDefaultCurrency] = useState<ICurrency>("USD");

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
    field: keyof ICreateTransactionInput,
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
    const transactionsToImport: ICreateTransactionInput[] = [];

    for (const rowIndex of selectedRows) {
      const candidate = candidates.find((c) => c.rowIndex === rowIndex);
      if (!candidate) continue;

      const edited = editedRows[rowIndex] || {};
      const transaction: ICreateTransactionInput = {
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
        <div className="p-4 bg-surface-hover rounded-lg grid grid-cols-2 grid-rows-2">
          <p className="text-sm col-start-1">
            <span className="font-medium">File:</span> {file.name}
          </p>
          <p className="text-sm col-start-1">
            <span className="font-medium">Size:</span>{" "}
            {(file.size / 1024).toFixed(2)} KB
          </p>

          <IconButton
            className="col-start-2 row-span-full self-center justify-self-end"
            clicked={() => {
              setFile(null);
            }}>
            <HiX className="h5 w-5 " />
          </IconButton>
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
            onChange={(value) => setDefaultCurrency(value as ICurrency)}
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
            const edited = editedRows[candidate.rowIndex] || {};
            const transaction = { ...candidate.data, ...edited };

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
                  <TableInput
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
                  />
                </BodyCell>
                <BodyCell>
                  <TableInput
                    type="text"
                    value={transaction.name || ""}
                    onChange={(e) =>
                      handleEditField(
                        candidate.rowIndex,
                        "name",
                        e.target.value
                      )
                    }
                  />
                </BodyCell>
                <BodyCell>
                  <TableInput
                    type="text"
                    value={transaction.amount || ""}
                    onChange={(e) =>
                      handleEditField(
                        candidate.rowIndex,
                        "amount",
                        e.target.value
                      )
                    }
                  />
                </BodyCell>
                <BodyCell>
                  <span className="text-sm font-medium">
                    {transaction.currency || defaultCurrency}
                  </span>
                </BodyCell>
                <BodyCell>
                  {defaultType ? (
                    <span className="text-sm font-medium">{defaultType}</span>
                  ) : (
                    <TableSelect
                      value={transaction.type || ""}
                      onChange={(e) =>
                        handleEditField(
                          candidate.rowIndex,
                          "type",
                          e.target.value
                        )
                      }>
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </TableSelect>
                  )}
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
    const buttons: IDialogProps["footerButtons"] = [];

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

    if (step === "upload") {
      buttons.push({
        clicked: () => {
          if (file) {
            setStep("mapping");
          }
        },
        disabled: !file,
        className:
          "px-4 py-2 border border-border rounded-lg hover:bg-surface-hover motion-safe:transition-colors",
        buttonContent: "Next",
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
    }

    if (step === "review") {
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
    }

    if (step === "confirm") {
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
    }

    return buttons;
  };

  const getSize = () => {
    if (step === "upload") {
      return "lg";
    } else if (step === "mapping") {
      return "full";
    } else if (step === "review") {
      return "full";
    } else if (step === "confirm") {
      return "lg";
    }
  };

  return (
    <Dialog
      title={getStepTitle()}
      content={renderStepContent()}
      footerButtons={getFooterButtons()}
      open={open}
      onOpenChange={onOpenChange}
      variant="modal"
      size={getSize()}
      dismissible={false}
    />
  );
}
