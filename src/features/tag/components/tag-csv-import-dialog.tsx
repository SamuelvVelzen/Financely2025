"use client";

import type {
  ICreateTagInput,
  ITagCsvCandidate,
  ITagCsvFieldMapping,
} from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { TableInput } from "@/features/ui/input/table-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { SelectableTable } from "@/features/ui/table/selectable-table";
import { TableRow } from "@/features/ui/table/table-row";
import { cn } from "@/util/cn";
import { useEffect, useState } from "react";
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
  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ITagCsvFieldMapping>({});
  const [candidates, setCandidates] = useState<ITagCsvCandidate[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editedRows, setEditedRows] = useState<
    Record<number, Partial<ICreateTagInput>>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [parseResponse, setParseResponse] = useState<any>(null);

  const uploadMutation = useUploadTagCsvFile();
  const mappingQuery = useGetTagCsvMapping(
    columns.length > 0 ? columns : undefined
  );
  const validateMutation = useValidateTagCsvMapping();
  const parseQuery = useParseTagCsvRows(file, mapping, currentPage, 50);
  const importMutation = useImportTagCsv();

  // Auto-detect mapping when columns are available
  useEffect(() => {
    if (columns.length > 0 && mappingQuery.data) {
      setMapping(mappingQuery.data);
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

  const handleEditField = (
    rowIndex: number,
    field: keyof ICreateTagInput,
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
    const tagsToImport: ICreateTagInput[] = [];

    for (const rowIndex of selectedRows) {
      const candidate = candidates.find((c) => c.rowIndex === rowIndex);
      if (!candidate) continue;

      const edited = editedRows[rowIndex];
      const tag: ICreateTagInput = {
        ...candidate.data,
        ...edited,
      };

      tagsToImport.push(tag);
    }

    try {
      await importMutation.mutateAsync(tagsToImport);
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
        return "Review Tags";
      case "confirm":
        return "Confirm Import";
      default:
        return "Import Tags from CSV";
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
            <div
              key={field.name}
              className="space-y-1">
              <label className="block text-sm font-medium">
                {field.label}
                {field.required && <span className="text-danger ml-1">*</span>}
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
          ]}>
          {candidates.map((candidate) => {
            const edited = editedRows[candidate.rowIndex] || {};
            const tag = { ...candidate.data, ...edited };

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
                    type="text"
                    value={tag.name || ""}
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
                    value={tag.color || ""}
                    onChange={(e) =>
                      handleEditField(
                        candidate.rowIndex,
                        "color",
                        e.target.value
                      )
                    }
                    placeholder="#FF6600"
                  />
                </BodyCell>
                <BodyCell>
                  <TableInput
                    type="text"
                    value={tag.description || ""}
                    onChange={(e) =>
                      handleEditField(
                        candidate.rowIndex,
                        "description",
                        e.target.value
                      )
                    }
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
        clicked: handleValidateMapping,
        className:
          "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors",
        buttonContent: validateMutation.isPending
          ? "Validating..."
          : "Continue",
        disabled: validateMutation.isPending,
      });
    } else if (step === "review") {
      buttons.push({
        clicked: () => setStep("confirm"),
        className:
          "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors",
        buttonContent: "Continue to Import",
        disabled: selectedRows.size === 0,
      });
    } else if (step === "confirm") {
      buttons.push({
        clicked: handleConfirmImport,
        className:
          "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover motion-safe:transition-colors",
        buttonContent: importMutation.isPending
          ? "Importing..."
          : "Confirm Import",
        disabled: importMutation.isPending || selectedRows.size === 0,
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
      content={
        <div className="max-h-[60vh] overflow-y-auto">
          {renderStepContent()}
        </div>
      }
      footerButtons={getFooterButtons()}
      open={open}
      onOpenChange={onOpenChange}
      variant="modal"
      size={getSize()}
      dismissible={!uploadMutation.isPending && !importMutation.isPending}
    />
  );
}
