import type {
  ICreateTransactionInput,
  ICsvCandidateTransaction,
  ICsvFieldMapping,
} from "@/features/shared/validation/schemas";
import { useFinForm } from "@/features/ui/form/useForm";
import { useToast } from "@/features/ui/toast";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { useDefaultCurrency } from "@/features/workspace/hooks/useWorkspaceSettings";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BankEnum } from "../../../config/banks";
import type { ITransactionFieldName } from "../../../config/transaction-fields";
import {
  useGetCsvMapping,
  useImportCsvTransactions,
  useTransformCsvRows,
} from "../../../hooks/useCsvImport";
import { BankProfileFactory } from "../../../services/bank.factory";
import { getDefaultStrategyForBank } from "../../../services/csv-type-detection";
import {
  TransactionImportContext,
  type IStep,
  type ITransactionImportContext,
  type ITransformResponse,
  type MappingFormData,
} from "./transaction-import-context";

function getRequiredMappingFields(
  bank: BankEnum,
  hasDefaultCurrency: boolean
): ITransactionFieldName[] {
  const base: ITransactionFieldName[] = ["amount", "transactionDate", "name"];
  const bankRequired = BankProfileFactory.getRequiredFields(bank);

  if (!hasDefaultCurrency) {
    base.push("currency");
  }

  return [...base, ...bankRequired];
}

interface ITransactionImportProviderProps {
  children: ReactNode;
  onClose: () => void;
}

export function TransactionImportProvider({
  children,
  onClose,
}: ITransactionImportProviderProps) {
  const [isPending, setIsPending] = useState(false);
  const workspaceId = useActiveWorkspaceId();
  const resolvedDefaultCurrency = useDefaultCurrency(workspaceId);

  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ICsvFieldMapping>({});
  const [candidates, setCandidates] = useState<ICsvCandidateTransaction[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [transformResponse, setTransformResponse] =
    useState<ITransformResponse | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankEnum>("DEFAULT");
  const [currentStep, setCurrentStep] = useState<IStep>("upload");
  const [uploadResetCounter, setUploadResetCounter] = useState(0);
  const [lastAppliedSuggestedKey, setLastAppliedSuggestedKey] = useState<
    string | null
  >(null);

  const typeDetectionStrategy = getDefaultStrategyForBank(selectedBank);

  const mappingForm = useFinForm<MappingFormData>({
    defaultValues: {
      defaultCurrency: resolvedDefaultCurrency,
      mappings: {},
    },
  });
  const { isDirty: mappingFormDirty } = mappingForm.formState;
  const defaultCurrency = mappingForm.watch("defaultCurrency");

  const toast = useToast();
  const mappingQuery = useGetCsvMapping(
    columns.length > 0 ? columns : undefined,
    selectedBank
  );
  const transformMutation = useTransformCsvRows();
  const importMutation = useImportCsvTransactions();

  const isBusy =
    isPending || transformMutation.isPending || importMutation.isPending;

  const requiredMappingFields = useMemo(
    () => getRequiredMappingFields(selectedBank, !!defaultCurrency),
    [selectedBank, defaultCurrency]
  );

  const suggestedMapping = mappingQuery.data?.mapping;

  const suggestedMappingKey =
    columns.length > 0 && suggestedMapping
      ? `${selectedBank}:${columns.join("\0")}`
      : null;

  if (
    suggestedMappingKey &&
    suggestedMappingKey !== lastAppliedSuggestedKey &&
    suggestedMapping
  ) {
    const formMappings: Record<string, string> = {};
    Object.entries(suggestedMapping).forEach(([field, column]) => {
      if (column) formMappings[field] = column;
    });
    mappingForm.setValue("mappings", formMappings);
    setMapping(suggestedMapping);
    setLastAppliedSuggestedKey(suggestedMappingKey);
  }

  const resetAllState = useCallback(() => {
    setRows([]);
    setColumns([]);
    setMapping({});
    setCandidates([]);
    setSelectedRows(new Set());
    setCurrentPage(1);
    setTransformResponse(null);
    setSelectedBank("DEFAULT");
    setLastAppliedSuggestedKey(null);
    setUploadResetCounter((counter) => counter + 1);
    mappingForm.reset({
      defaultCurrency: resolvedDefaultCurrency,
      mappings: {},
    });
  }, [mappingForm, resolvedDefaultCurrency]);

  const hasUnsavedChanges = useMemo(() => {
    const mappingHasValues = Object.values(mapping).some(Boolean);
    return (
      rows.length > 0 ||
      columns.length > 0 ||
      mappingHasValues ||
      candidates.length > 0 ||
      selectedRows.size > 0 ||
      currentPage !== 1 ||
      selectedBank !== "DEFAULT" ||
      mappingFormDirty
    );
  }, [
    rows,
    columns,
    mapping,
    candidates,
    selectedRows,
    currentPage,
    selectedBank,
    mappingFormDirty,
  ]);

  const handleMappingFieldChange = useCallback((field: string, column: string | null) => {
    if (mapping[field] !== column) {
      setMapping((prev) => ({
        ...prev,
        [field]: column,
      }));
    }
  }, [mapping]);

  useEffect(() => {
    mappingForm.clearErrors();

    requiredMappingFields.forEach((field) => {
      mappingForm.register(`mappings.${field}`, {
        required: `${field} mapping is required`,
        validate: (value) => {
          if (!value || value.trim() === "") {
            return `${field} mapping is required`;
          }
          return true;
        },
      });
    });
  }, [requiredMappingFields, mappingForm]);

  const handleMappingChange = (field: string, column: string | null) => {
    setMapping((prev) => ({
      ...prev,
      [field]: column,
    }));
    mappingForm.setValue(`mappings.${field}`, column || "");
  };

  const handleResetToSuggested = (fieldName: string) => {
    const suggestedColumn = suggestedMapping?.[fieldName];
    if (suggestedColumn) {
      handleMappingChange(fieldName, suggestedColumn);
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

  const updateCandidate = useCallback(
    (
      rowIndex: number,
      updates: Partial<ICreateTransactionInput> & {
        tagSuggestions?: ICsvCandidateTransaction["tagSuggestions"];
      },
    ) => {
      const { tagSuggestions, ...dataUpdates } = updates;
      setCandidates((prev) =>
        prev.map((c) =>
          c.rowIndex === rowIndex
            ? {
                ...c,
                ...(tagSuggestions !== undefined && { tagSuggestions }),
                data: { ...c.data, ...dataUpdates },
              }
            : c,
        ),
      );
    },
    [],
  );

  const handleValidateMapping = async (goToStep: (step: IStep) => void) => {
    try {
      const transformResult = await transformMutation.mutateAsync({
        rows,
        mapping,
        typeDetectionStrategy,
        defaultCurrency,
        bank: selectedBank || undefined,
      });

      const candidatesWithDefaults = transformResult.candidates.map((c) => {
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
      setTransformResponse({
        total: transformResult.total,
        totalValid: transformResult.totalValid,
        totalInvalid: transformResult.totalInvalid,
      });

      setSelectedRows(new Set());

      goToStep("review");
    } catch (error) {
      console.error("Transform failed:", error);
      toast.error("Failed to process CSV data");
    }
  };

  const handleConfirmImport = async () => {
    const transactionsToImport: ICreateTransactionInput[] = [];

    for (const rowIndex of selectedRows) {
      const candidate = candidates.find((c) => c.rowIndex === rowIndex);
      if (
        !candidate ||
        !candidate.data.type ||
        !candidate.data.amount ||
        !candidate.data.transactionDate ||
        !candidate.data.name
      ) {
        continue;
      }

      const transaction: ICreateTransactionInput = {
        ...candidate.data,
        type: candidate.data.type,
        currency: candidate.data.currency || defaultCurrency || "EUR",
        amount: candidate.data.amount,
        transactionDate: candidate.data.transactionDate,
        name: candidate.data.name,
        tagIds: candidate.data.tagIds || [],
      };

      transactionsToImport.push(transaction);
    }

    try {
      await importMutation.mutateAsync(transactionsToImport);
      toast.success(
        `Successfully imported ${transactionsToImport.length} transactions`
      );
      resetAllState();
      onClose();
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import transactions");
    }
  };

  const contextValue: ITransactionImportContext = {
    rows,
    columns,
    mapping,
    candidates,
    selectedRows,
    currentPage,
    transformResponse,
    selectedBank,
    currentStep,
    defaultCurrency,
    suggestedMapping,
    typeDetectionStrategy,
    mappingForm,
    requiredMappingFields,
    hasUnsavedChanges,
    isBusy,
    uploadResetCounter,
    setRows,
    setColumns,
    setMapping,
    setCandidates,
    setSelectedRows,
    setCurrentPage,
    setTransformResponse,
    setSelectedBank,
    setCurrentStep,
    setIsPending,
    handleMappingChange,
    handleMappingFieldChange,
    handleResetToSuggested,
    handleSelectAllValid,
    handleExcludeAllInvalid,
    handleValidateMapping,
    handleConfirmImport,
    updateCandidate,
    resetAllState,
    transformMutation,
    importMutation,
    onCloseSuccessful: onClose,
  };

  return (
    <TransactionImportContext.Provider value={contextValue}>
      {children}
    </TransactionImportContext.Provider>
  );
}
