"use client";

import type {
  ICreateTagInput,
  ITagCsvCandidate,
  ITagCsvFieldMapping,
} from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { IDialogProps } from "@/features/ui/dialog/dialog/types";
import { UnsavedChangesDialog } from "@/features/ui/dialog/unsaved-changes-dialog";
import { Form } from "@/features/ui/form/form";
import { TextInput } from "@/features/ui/input/text-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { SelectableTable } from "@/features/ui/table/selectable-table";
import { TableRow } from "@/features/ui/table/table-row";
import { cn } from "@/util/cn";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  useGetTagCsvMapping,
  useImportTagCsv,
  useParseTagCsvRows,
  useUploadTagCsvFile,
  useValidateTagCsvMapping,
} from "../hooks/useTagCsvImport";

interface TagCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = "upload" | "mapping" | "review" | "confirm";

const TAG_FIELDS = [
  { name: "name", label: "Name", required: true, description: "Tag name" },
  {
    name: "color",
    label: "Color",
    required: false,
    description: "Hex color (e.g., #FF6600)",
  },
  {
    name: "description",
    label: "Description",
    required: false,
    description: "Tag description",
  },
];

export function TagCsvImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: TagCsvImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ITagCsvFieldMapping>({});
  const [candidates, setCandidates] = useState<ITagCsvCandidate[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [parseResponse, setParseResponse] = useState<any>(null);

  // Form for mapping step controls
  type MappingFormData = {
    mappings: Record<string, string>;
  };
  const mappingForm = useForm<MappingFormData>({
    defaultValues: {
      mappings: {},
    },
  });
  const { isDirty: mappingFormDirty } = mappingForm.formState;

  // Form for managing all row edits
  type RowFormData = {
    rows: Record<
      number,
      {
        name?: string;
        color?: string;
        description?: string;
      }
    >;
  };
  const rowForm = useForm<RowFormData>({
    defaultValues: {
      rows: {},
    },
  });
  const { isDirty: rowFormDirty } = rowForm.formState;

  const uploadMutation = useUploadTagCsvFile();
  const mappingQuery = useGetTagCsvMapping(
    columns.length > 0 ? columns : undefined
  );
  const validateMutation = useValidateTagCsvMapping();
  const parseQuery = useParseTagCsvRows(file, mapping, currentPage, 50);
  const importMutation = useImportTagCsv();
  const isBusy =
    uploadMutation.isPending ||
    validateMutation.isPending ||
    importMutation.isPending;

  const resetAllState = () => {
    setStep("upload");
    setFile(null);
    setColumns([]);
    setMapping({});
    setCandidates([]);
    setSelectedRows(new Set());
    setCurrentPage(1);
    setParseResponse(null);
    mappingForm.reset({ mappings: {} });
    rowForm.reset({ rows: {} });
  };

  const hasUnsavedChanges = useMemo(() => {
    const mappingHasValues = Object.values(mapping).some(Boolean);
    return (
      file !== null ||
      step !== "upload" ||
      columns.length > 0 ||
      mappingHasValues ||
      candidates.length > 0 ||
      selectedRows.size > 0 ||
      currentPage !== 1 ||
      mappingFormDirty ||
      rowFormDirty
    );
  }, [
    file,
    step,
    columns,
    mapping,
    candidates,
    selectedRows,
    currentPage,
    mappingFormDirty,
    rowFormDirty,
  ]);

  const handleDialogClose = () => {
    resetAllState();
    onOpenChange(false);
  };

  const handleAttemptClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    handleDialogClose();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    handleAttemptClose();
  };

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
      setCandidates(parseQuery.data.candidates);
      setParseResponse(parseQuery.data);
      // Auto-select all valid rows
      const validIndices = parseQuery.data.candidates
        .filter((c) => c.status === "valid")
        .map((c) => c.rowIndex);
      setSelectedRows(new Set(validIndices));

      // Initialize form with candidate data
      const initialRows: RowFormData["rows"] = {};
      parseQuery.data.candidates.forEach((c) => {
        initialRows[c.rowIndex] = {
          name: c.data.name || "",
          color: c.data.color || "",
          description: c.data.description || "",
        };
      });
      rowForm.reset({ rows: initialRows });
    }
  }, [parseQuery.data]);

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
      const result = await validateMutation.mutateAsync(mapping);
      if (result.valid) {
        setStep("review");
        parseQuery.refetch();
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
    const tagsToImport: ICreateTagInput[] = [];
    const formData = rowForm.getValues();

    for (const rowIndex of selectedRows) {
      const candidate = candidates.find((c) => c.rowIndex === rowIndex);
      if (!candidate) continue;

      const edited = formData.rows[rowIndex] || {};
      const tag: ICreateTagInput = {
        ...candidate.data,
        name: edited.name || candidate.data.name,
        color: edited.color || candidate.data.color,
        description: edited.description || candidate.data.description,
      };

      tagsToImport.push(tag);
    }

    try {
      await importMutation.mutateAsync(tagsToImport);
      onSuccess?.();
      handleDialogClose();
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  useEffect(() => {
    if (!open) {
      setShowUnsavedDialog(false);
    }
  }, [open]);

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

  const renderMappingStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Map CSV columns to tag fields. Required fields are marked with an
        asterisk (*).
      </p>
      <div className="space-y-3">
        {TAG_FIELDS.map((field) => {
          const columnOptions = [
            { value: "", label: "— Not mapped —" },
            ...columns.map((col) => ({ value: col, label: col })),
          ];
          const currentValue = mapping[field.name] || "";

          return (
            <div key={field.name} className="space-y-1">
              <label className="block text-sm font-medium">
                {field.label}
                {field.required && <span className="text-danger ml-1">*</span>}
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
      return <div className="text-center py-8">No tags found</div>;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            Showing {candidates.length} of {parseResponse?.total || 0} tags (
            {parseResponse?.totalValid || 0} valid,{" "}
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
            <HeaderCell align="left">Name</HeaderCell>,
            <HeaderCell align="left">Color</HeaderCell>,
            <HeaderCell align="left">Description</HeaderCell>,
            <HeaderCell align="left">Errors</HeaderCell>,
          ]}
        >
          <Form form={rowForm} onSubmit={() => {}}>
            {candidates.map((candidate) => {
              const rowIndex = candidate.rowIndex;
              const rowData = rowForm.watch(`rows.${rowIndex}`) || {};
              const tag = {
                ...candidate.data,
                name: rowData.name || candidate.data.name,
                color: rowData.color || candidate.data.color,
                description: rowData.description || candidate.data.description,
              };

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
                    <TextInput
                      name={`rows.${rowIndex}.name`}
                      className="!px-2 !py-1 !text-sm"
                    />
                  </BodyCell>
                  <BodyCell>
                    <TextInput
                      name={`rows.${rowIndex}.color`}
                      placeholder="#FF6600"
                      className="!px-2 !py-1 !text-sm"
                    />
                  </BodyCell>
                  <BodyCell>
                    <TextInput
                      name={`rows.${rowIndex}.description`}
                      className="!px-2 !py-1 !text-sm"
                    />
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
              clicked={() => setCurrentPage((p) => Math.max(1, p - 1))}
              buttonContent="Previous"
              disabled={currentPage === 1}
              className="px-4 py-2"
            />
            <span className="px-4 py-2 text-sm">
              Page {currentPage} of{" "}
              {Math.ceil((parseResponse?.total || 0) / 50)}
            </span>
            <Button
              clicked={() => setCurrentPage((p) => p + 1)}
              buttonContent="Next"
              disabled={!parseResponse?.hasNext}
              className="px-4 py-2"
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
            <strong>{totalCount}</strong> tags.
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

  const StepOptions: {
    [key in Step]: {
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
      title: "Review Tags",
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
    <>
      <Dialog
        title={options.title}
        content={options.content}
        footerButtons={options.footerButtons}
        open={open}
        onOpenChange={handleDialogOpenChange}
        variant="modal"
        size={options.size}
        dismissible={!isBusy}
        onClose={resetAllState}
      />
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onConfirm={() => {
          setShowUnsavedDialog(false);
          handleDialogClose();
        }}
        onCancel={() => setShowUnsavedDialog(false)}
      />
    </>
  );
}
