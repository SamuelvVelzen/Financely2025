"use client";

import type {
  ICreateTagInput,
  ITagCsvCandidate,
  ITagCsvFieldMapping,
} from "@/features/shared/validation/schemas";
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
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
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
    setFile(null);
    setColumns([]);
    setMapping({});
    setCandidates([]);
    setSelectedRows(new Set());
    setCurrentPage(1);
    setParseResponse(null);
    mappingForm.reset({ mappings: {} });
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
      mappingFormDirty
    );
  }, [
    file,
    columns,
    mapping,
    candidates,
    selectedRows,
    currentPage,
    mappingFormDirty,
  ]);

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
    }
  }, [parseQuery.data]);

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

  const handleValidateMapping = async (goToStep: (step: Step) => void) => {
    try {
      const result = await validateMutation.mutateAsync(mapping);
      if (result.valid) {
        goToStep("review");
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

    for (const rowIndex of selectedRows) {
      const candidate = candidates.find((c) => c.rowIndex === rowIndex);
      if (!candidate) continue;

      const tag: ICreateTagInput = {
        ...candidate.data,
      };

      tagsToImport.push(tag);
    }

    try {
      await importMutation.mutateAsync(tagsToImport);
      onSuccess?.();
      resetAllState();
      onOpenChange(false);
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const renderUploadStep = (navigation: IStepNavigation<Step>) => (
    <div className="space-y-4">
      <div>
        <FileUploadInput
          label="Select CSV File"
          accept=".csv"
          files={file}
          onFilesChange={handleFileChange}
        />
      </div>
      {uploadMutation.isError && (
        <div className="p-3 bg-danger/10 border border-danger rounded-2xl">
          <p className="text-sm text-danger">
            {uploadMutation.error?.message || "Upload failed"}
          </p>
        </div>
      )}
    </div>
  );

  const renderMappingStep = (navigation: IStepNavigation<Step>) => (
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
            <div
              key={field.name}
              className="space-y-1">
              <Label required={field.required}>{field.label}</Label>
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
        <div className="p-3 bg-danger/10 border border-danger rounded-2xl">
          <p className="text-sm text-danger">
            {validateMutation.error?.message || "Validation failed"}
          </p>
        </div>
      )}
    </div>
  );

  const renderReviewStep = (navigation: IStepNavigation<Step>) => {
    if (parseQuery.isLoading) {
      return <div className="text-center py-8">Parsing CSV...</div>;
    }

    if (parseQuery.isError) {
      return (
        <div className="p-3 bg-danger/10 border border-danger rounded-2xl">
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
            <HeaderCell key="status">Status</HeaderCell>,
            <HeaderCell key="name">Name</HeaderCell>,
            <HeaderCell key="color">Color</HeaderCell>,
            <HeaderCell key="description">Description</HeaderCell>,
            <HeaderCell key="errors">Errors</HeaderCell>,
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
                  <span className="text-sm text-text">
                    {candidate.data.name || "—"}
                  </span>
                </BodyCell>
                <BodyCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text">
                      {candidate.data.color || "—"}
                    </span>
                    {candidate.data.color && (
                      <span
                        className="size-4 rounded border border-border"
                        style={{ backgroundColor: candidate.data.color }}
                      />
                    )}
                  </div>
                </BodyCell>
                <BodyCell>
                  <span className="text-sm text-text-muted">
                    {candidate.data.description || "—"}
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

  const renderConfirmStep = (navigation: IStepNavigation<Step>) => {
    const selectedCount = selectedRows.size;
    const totalCount = candidates.length;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-surface-hover rounded-2xl">
          <p className="text-sm font-medium mb-2">Import Summary</p>
          <p className="text-sm">
            You are about to import <strong>{selectedCount}</strong> of{" "}
            <strong>{totalCount}</strong> tags.
          </p>
        </div>
        {importMutation.isError && (
          <div className="p-3 bg-danger/10 border border-danger rounded-2xl">
            <p className="text-sm text-danger">
              {importMutation.error?.message || "Import failed"}
            </p>
          </div>
        )}
      </div>
    );
  };

  const steps: Record<Step, IStepConfig<Step>> = {
    upload: {
      title: "Upload CSV File",
      size: "lg",
      content: renderUploadStep,
      footerButtons: (navigation: IStepNavigation<Step>) => [
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
      size: "full",
      content: renderMappingStep,
      footerButtons: (navigation: IStepNavigation<Step>) => [
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
          loading: {
            isLoading: validateMutation.isPending,
            text: "Validating mapping",
          },
          buttonContent: "Continue",
        },
      ],
    },
    review: {
      title: "Review Tags",
      size: "full",
      content: renderReviewStep,
      footerButtons: (navigation: IStepNavigation<Step>) => [
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
      size: "lg",
      content: renderConfirmStep,
      footerButtons: (navigation: IStepNavigation<Step>) => [
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
