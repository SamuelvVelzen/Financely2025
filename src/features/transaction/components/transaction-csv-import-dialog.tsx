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
import { TextInput } from "@/features/ui/input/text-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Form } from "@/features/ui/form/form";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { SelectableTable } from "@/features/ui/table/selectable-table";
import { TableRow } from "@/features/ui/table/table-row";
import { cn } from "@/util/cn";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [parseResponse, setParseResponse] = useState<any>(null);
  
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
  const typeDetectionStrategy = mappingForm.watch("typeDetectionStrategy");
  const defaultCurrency = mappingForm.watch("defaultCurrency");

  // Form for managing all row edits
  type RowFormData = {
    rows: Record<
      number,
      {
        occurredAt?: string;
        name?: string;
        amount?: string;
        type?: string;
      }
    >;
  };
  const rowForm = useForm<RowFormData>({
    defaultValues: {
      rows: {},
    },
  });

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
      // Also update form
      const formMappings: Record<string, string> = {};
      Object.entries(mappingQuery.data).forEach(([field, column]) => {
        if (column) formMappings[field] = column;
      });
      mappingForm.setValue("mappings", formMappings);
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
      
      // Initialize form with candidate data
      const initialRows: RowFormData["rows"] = {};
      candidatesWithDefaults.forEach((c) => {
        initialRows[c.rowIndex] = {
          occurredAt: c.data.occurredAt
            ? new Date(c.data.occurredAt).toISOString().split("T")[0]
            : "",
          name: c.data.name || "",
          amount: c.data.amount || "",
          type: c.data.type || "",
        };
      });
      rowForm.reset({ rows: initialRows });
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

  // handleEditField is no longer needed - form handles it

  const handleConfirmImport = async () => {
    const transactionsToImport: ICreateTransactionInput[] = [];
    const formData = rowForm.getValues();

    for (const rowIndex of selectedRows) {
      const candidate = candidates.find((c) => c.rowIndex === rowIndex);
      if (!candidate) continue;

      const edited = formData.rows[rowIndex] || {};
      const transaction: ICreateTransactionInput = {
        ...candidate.data,
        occurredAt: edited.occurredAt
          ? new Date(edited.occurredAt).toISOString()
          : candidate.data.occurredAt,
        name: edited.name || candidate.data.name,
        amount: edited.amount || candidate.data.amount,
        type:
          defaultType ||
          edited.type ||
          candidate.data.type ||
          "EXPENSE",
        currency: candidate.data.currency || defaultCurrency,
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
      setCurrentPage(1);
      rowForm.reset({ rows: {} });
    } catch (error) {
      console.error("Import failed:", error);
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
                    label: "Amex Format - Negative = Income, Positive = Expense",
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
          <Form form={rowForm} onSubmit={() => {}}>
            {candidates.map((candidate) => {
              const rowIndex = candidate.rowIndex;
              const rowData = rowForm.watch(`rows.${rowIndex}`) || {};
              const transaction = {
                ...candidate.data,
                occurredAt: rowData.occurredAt
                  ? new Date(rowData.occurredAt).toISOString()
                  : candidate.data.occurredAt,
                name: rowData.name || candidate.data.name,
                amount: rowData.amount || candidate.data.amount,
                type: rowData.type || candidate.data.type,
              };

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
                    <TextInput
                      name={`rows.${rowIndex}.occurredAt`}
                      label=""
                      type="date"
                      className="!px-2 !py-1 !text-sm"
                    />
                  </BodyCell>
                  <BodyCell>
                    <TextInput
                      name={`rows.${rowIndex}.name`}
                      label=""
                      className="!px-2 !py-1 !text-sm"
                    />
                  </BodyCell>
                  <BodyCell>
                    <TextInput
                      name={`rows.${rowIndex}.amount`}
                      label=""
                      className="!px-2 !py-1 !text-sm"
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
                      <SelectDropdown
                        name={`rows.${rowIndex}.type`}
                        options={[
                          { value: "EXPENSE", label: "Expense" },
                          { value: "INCOME", label: "Income" },
                        ]}
                        placeholder="Select type"
                      />
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
          </Form>
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

  const resetDialog = () => {
    setStep("upload");
    setFile(null);
  };

  const StepOptions: {
    [key in IStep]: {
      content: React.ReactNode;
      title: string;
      size: IDialogProps["size"];
      footerButtons: IDialogProps["footerButtons"];
    };
  } = {
    upload: {
      title: "Upload CSV File",
      size: "lg",
      content: renderUploadStep(),
      footerButtons: [
        {
          clicked: () => setStep("mapping"),
          disabled: !file,
          buttonContent: "Next",
        },
      ],
    },
    mapping: {
      title: "Map Fields",
      size: "full",
      content: renderMappingStep(),
      footerButtons: [
        {
          clicked: () => setStep("upload"),
          buttonContent: "Back",
        },
        {
          clicked: () => {
            if (!validateMutation.isPending) {
              handleValidateMapping();
            }
          },
          variant: "primary",
          disabled: validateMutation.isPending,
          buttonContent: validateMutation.isPending
            ? "Validating..."
            : "Continue",
        },
      ],
    },
    review: {
      title: "Review Transactions",
      size: "full",
      content: renderReviewStep(),
      footerButtons: [
        {
          clicked: () => setStep("mapping"),
          buttonContent: "Back",
        },
        {
          clicked: () => {
            if (selectedRows.size > 0) {
              setStep("confirm");
            }
          },
          variant: "primary",
          disabled: selectedRows.size === 0,
          buttonContent: "Continue to Import",
        },
      ],
    },
    confirm: {
      title: "Confirm Import",
      size: "lg",
      content: renderConfirmStep(),
      footerButtons: [
        {
          clicked: () => setStep("review"),
          buttonContent: "Back",
        },
        {
          clicked: () => {
            if (!importMutation.isPending && selectedRows.size > 0) {
              handleConfirmImport();
            }
          },
          variant: "primary",
          disabled: importMutation.isPending || selectedRows.size === 0,
          buttonContent: importMutation.isPending
            ? "Importing..."
            : "Confirm Import",
        },
      ],
    },
  };

  const options = StepOptions[step];

  return (
    <Dialog
      title={options.title}
      content={options.content}
      footerButtons={options.footerButtons}
      open={open}
      onOpenChange={onOpenChange}
      variant="modal"
      size={options.size}
      dismissible={false}
      onClose={resetDialog}
    />
  );
}
