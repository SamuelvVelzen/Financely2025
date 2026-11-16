import type {
  ICreateTagInput,
  ITagCsvFieldMapping,
} from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { Form } from "@/features/ui/form/form";
import { useFinForm } from "@/features/ui/form/useForm";
import { FileUploadInput } from "@/features/ui/input/file-upload-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { BodyCell } from "@/features/ui/table/body-cell";
import { HeaderCell } from "@/features/ui/table/header-cell";
import { SelectableTable } from "@/features/ui/table/selectable-table";
import { TableRow } from "@/features/ui/table/table-row";
import { useToast } from "@/features/ui/toast";
import { Label } from "@/features/ui/typography/label";
import { MultiStepPage } from "@/features/ui/wizard/multi-step-page";
import type {
  IStepConfig,
  IStepNavigation,
} from "@/features/ui/wizard/multi-step-types";
import { cn } from "@/features/util/cn";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState, type ReactElement } from "react";
import {
  useGetTagCsvMapping,
  useImportTagCsv,
  useParseTagCsvRows,
  useUploadTagCsvFile,
  useValidateTagCsvMapping,
} from "../hooks/useTagCsvImport";

type ITagCsvImportPageProps = {
  /**
   * Embed inside another surface: hide page chrome, skip route blocking,
   * and call callbacks instead of navigating away.
   */
  embedded?: boolean;
  onEmbeddedSuccess?: () => void;
  onEmbeddedCancel?: () => void;
};

type IStep = "upload" | "mapping" | "review" | "confirm";

const STEP_ORDER = ["upload", "mapping", "review", "confirm"] as const;

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

export function TagCsvImportPage({
  embedded = false,
  onEmbeddedSuccess,
  onEmbeddedCancel,
}: ITagCsvImportPageProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const workspaceId = useActiveWorkspaceId();
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);

  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [manualMapping, setManualMapping] =
    useState<ITagCsvFieldMapping | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [lastAutoSelectKey, setLastAutoSelectKey] = useState<string | null>(
    null,
  );
  const [lastSyncedMappingFormKey, setLastSyncedMappingFormKey] = useState<
    string | null
  >(null);

  type MappingFormData = {
    mappings: Record<string, string>;
  };
  const mappingForm = useFinForm<MappingFormData>({
    defaultValues: {
      mappings: {},
    },
  });
  const { isDirty: mappingFormDirty } = mappingForm.formState;

  const uploadMutation = useUploadTagCsvFile();
  const mappingQuery = useGetTagCsvMapping(
    columns.length > 0 ? columns : undefined,
  );
  const detectedMapping = mappingQuery.data;
  const mapping = useMemo(
    () => manualMapping ?? detectedMapping ?? {},
    [manualMapping, detectedMapping],
  );
  const validateMutation = useValidateTagCsvMapping();
  const parseQuery = useParseTagCsvRows(file, mapping, currentPage, 50);
  const parseResponse = parseQuery.data ?? null;
  const candidates = useMemo(
    () => parseResponse?.candidates ?? [],
    [parseResponse?.candidates],
  );
  const mappingFormSyncKey =
    columns.length > 0 && detectedMapping
      ? `${columns.join("|")}:${JSON.stringify(detectedMapping)}`
      : null;

  if (
    mappingFormSyncKey &&
    mappingFormSyncKey !== lastSyncedMappingFormKey &&
    manualMapping === null &&
    detectedMapping
  ) {
    setLastSyncedMappingFormKey(mappingFormSyncKey);
    const formMappings: Record<string, string> = {};
    Object.entries(detectedMapping).forEach(([field, column]) => {
      if (column) formMappings[field] = column;
    });
    mappingForm.reset({ mappings: formMappings });
  }

  const parseDataKey = parseResponse
    ? `${file?.name ?? ""}:${currentPage}:${JSON.stringify(mapping)}:${parseResponse.candidates.length}`
    : null;

  if (parseDataKey && parseDataKey !== lastAutoSelectKey && parseResponse) {
    setLastAutoSelectKey(parseDataKey);
    const validIndices = parseResponse.candidates
      .filter((c) => c.status === "valid")
      .map((c) => c.rowIndex);
    setSelectedRows(new Set(validIndices));
  }

  const importMutation = useImportTagCsv();
  const isBusy =
    uploadMutation.isPending ||
    validateMutation.isPending ||
    importMutation.isPending;

  const resetAllState = useCallback(() => {
    setFile(null);
    setColumns([]);
    setManualMapping(null);
    setSelectedRows(new Set());
    setCurrentPage(1);
    setLastAutoSelectKey(null);
    setLastSyncedMappingFormKey(null);
    mappingForm.reset({ mappings: {} });
  }, [mappingForm]);

  const goToTags = useCallback(() => {
    navigate({
      to: "/$workspaceId/tags",
      params: { workspaceId: workspaceRouteParam },
      ignoreBlocker: true,
    });
  }, [navigate, workspaceRouteParam]);

  const handleLeave = useCallback(() => {
    if (embedded) {
      onEmbeddedCancel?.();
      return;
    }
    goToTags();
  }, [embedded, onEmbeddedCancel, goToTags]);

  const handleComplete = useCallback(() => {
    if (embedded) {
      onEmbeddedSuccess?.();
      return;
    }
    goToTags();
  }, [embedded, onEmbeddedSuccess, goToTags]);

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

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null);
      return;
    }

    setFile(nextFile);
  };

  const handleMappingFieldChange = (field: string, column: string | null) => {
    if (mapping[field] !== column) {
      setManualMapping((prev) => ({
        ...(prev ?? detectedMapping ?? {}),
        [field]: column,
      }));
    }
  };

  const handleValidateMapping = async (goToStep: (step: IStep) => void) => {
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
      toast.success(`Successfully imported ${tagsToImport.length} tags`);
      resetAllState();
      handleComplete();
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const renderUploadStep = (_navigation: IStepNavigation<IStep>) => (
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

  const renderMappingStep = (_navigation: IStepNavigation<IStep>) => (
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
                  onValueChange={(value) => {
                    const column = (value as string) || null;
                    handleMappingFieldChange(field.name, column);
                  }}
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

  const renderReviewStep = (_navigation: IStepNavigation<IStep>) => {
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
          selectedKeys={selectedRows}
          onSelectionChange={setSelectedRows}
          rowCount={candidates.length}
          getRowKey={(row: ReactElement) => {
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
                  candidate.status === "invalid" && "bg-danger/5",
                )}>
                <BodyCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs",
                      candidate.status === "valid" &&
                        "bg-success/20 text-success",
                      candidate.status === "invalid" &&
                        "bg-danger/20 text-danger",
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

  const renderConfirmStep = (_navigation: IStepNavigation<IStep>) => {
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

  const steps: Record<IStep, IStepConfig<IStep>> = {
    upload: {
      title: "Upload CSV File",
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
                setManualMapping(null);
                setLastSyncedMappingFormKey(null);
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
    <MultiStepPage
      title="Import tags"
      backAriaLabel="Back to tags"
      steps={steps}
      stepOrder={STEP_ORDER}
      initialStep="upload"
      embedded={embedded}
      hasUnsavedChanges={hasUnsavedChanges}
      dismissible={!isBusy}
      onReset={resetAllState}
      onLeave={handleLeave}
    />
  );
}
