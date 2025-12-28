"use client";

import type {
  ICreateTransactionInput,
  ICsvCandidateTransaction,
  ICsvFieldMapping,
  ICurrency,
} from "@/features/shared/validation/schemas";
import { useFinForm } from "@/features/ui/form/useForm";
import { useToast } from "@/features/ui/toast";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type UseFormReturn } from "react-hook-form";
import type { BankEnum } from "../../../config/banks";
import type { ITransactionFieldName } from "../../../config/transaction-fields";
import {
  useGetCsvMapping,
  useImportCsvTransactions,
  useTransformCsvRows,
} from "../../../hooks/useCsvImport";
import { BankProfileFactory } from "../../../services/bank.factory";
import { getDefaultStrategyForBank } from "../../../services/csv-type-detection";

/**
 * Compute required mapping fields based on bank and whether default currency is set.
 * Base required fields: amount, occurredAt, name
 * Additional fields based on bank profile (e.g., ING requires "type")
 * Currency is required if no default currency is set
 */
function getRequiredMappingFields(
  bank: BankEnum | null,
  hasDefaultCurrency: boolean
): ITransactionFieldName[] {
  // Base required fields (always needed in mapping)
  const base: ITransactionFieldName[] = ["amount", "occurredAt", "name"];

  // Add bank-specific required fields (e.g., ING requires "type")
  const bankRequired = BankProfileFactory.getRequiredFields(bank);

  // Add currency if no default currency is set
  if (!hasDefaultCurrency) {
    base.push("currency");
  }

  return [...base, ...bankRequired];
}

export type IStep = "upload" | "mapping" | "review" | "confirm";

export type MappingFormData = {
  defaultCurrency: ICurrency;
  mappings: Record<string, string>;
};

export interface ITransformResponse {
  total: number;
  totalValid: number;
  totalInvalid: number;
}

export interface ITransactionImportContext {
  // State
  rows: Record<string, string>[];
  columns: string[];
  mapping: ICsvFieldMapping;
  candidates: ICsvCandidateTransaction[];
  selectedRows: Set<number>;
  currentPage: number;
  transformResponse: ITransformResponse | null;
  selectedBank: BankEnum | null;
  currentStep: IStep;
  defaultCurrency: ICurrency;
  suggestedMapping: ICsvFieldMapping | undefined;
  typeDetectionStrategy: string;
  mappingForm: UseFormReturn<MappingFormData>;
  requiredMappingFields: ITransactionFieldName[];

  // Computed
  hasUnsavedChanges: boolean;
  isBusy: boolean;

  // Setters
  setRows: (rows: Record<string, string>[]) => void;
  setColumns: (columns: string[]) => void;
  setMapping: React.Dispatch<React.SetStateAction<ICsvFieldMapping>>;
  setCandidates: (candidates: ICsvCandidateTransaction[]) => void;
  setSelectedRows: (rows: Set<number>) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setTransformResponse: (response: ITransformResponse | null) => void;
  setSelectedBank: (bank: BankEnum | null) => void;
  setCurrentStep: (step: IStep) => void;

  setIsPending: (isPending: boolean) => void;

  // Handlers
  handleMappingChange: (field: string, column: string | null) => void;
  handleResetToSuggested: (fieldName: string) => void;
  handleSelectAllValid: () => void;
  handleExcludeAllInvalid: () => void;
  handleValidateMapping: (goToStep: (step: IStep) => void) => Promise<void>;
  handleConfirmImport: () => Promise<void>;
  resetAllState: () => void;

  // Mutations
  transformMutation: ReturnType<typeof useTransformCsvRows>;
  importMutation: ReturnType<typeof useImportCsvTransactions>;

  // Other
  onClose: () => void;
}

const TransactionImportContext =
  createContext<ITransactionImportContext | null>(null);

export function useTransactionImportContext() {
  const context = useContext(TransactionImportContext);
  if (!context) {
    throw new Error(
      "useTransactionImportContext must be used within TransactionImportProvider"
    );
  }
  return context;
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

  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ICsvFieldMapping>({});
  const [candidates, setCandidates] = useState<ICsvCandidateTransaction[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [transformResponse, setTransformResponse] =
    useState<ITransformResponse | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankEnum | null>(null);
  const [currentStep, setCurrentStep] = useState<IStep>("upload");

  // Derive strategy from bank selection
  const typeDetectionStrategy = getDefaultStrategyForBank(selectedBank);

  // Form for mapping step controls
  const mappingForm = useFinForm<MappingFormData>({
    defaultValues: {
      defaultCurrency: "EUR",
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

  // Compute required mapping fields based on bank and default currency
  const requiredMappingFields = useMemo(
    () => getRequiredMappingFields(selectedBank, !!defaultCurrency),
    [selectedBank, defaultCurrency]
  );

  const suggestedMapping = mappingQuery.data?.mapping;

  const resetAllState = useCallback(() => {
    setRows([]);
    setColumns([]);
    setMapping({});
    setCandidates([]);
    setSelectedRows(new Set());
    setCurrentPage(1);
    setTransformResponse(null);
    setSelectedBank(null);
    mappingForm.reset({
      defaultCurrency: "EUR",
      mappings: {},
    });
  }, [mappingForm]);

  const hasUnsavedChanges = useMemo(() => {
    const mappingHasValues = Object.values(mapping).some(Boolean);
    return (
      rows.length > 0 ||
      columns.length > 0 ||
      mappingHasValues ||
      candidates.length > 0 ||
      selectedRows.size > 0 ||
      currentPage !== 1 ||
      selectedBank !== null ||
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

  // Auto-detect mapping when columns are available or bank changes
  useEffect(() => {
    if (columns.length > 0 && suggestedMapping) {
      setMapping(suggestedMapping);
      const formMappings: Record<string, string> = {};
      Object.entries(suggestedMapping).forEach(([field, column]) => {
        if (column) formMappings[field] = column;
      });
      mappingForm.setValue("mappings", formMappings);
    }
  }, [columns, suggestedMapping, mappingForm, selectedBank]);

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

  // Register form validation rules for required mapping fields
  useEffect(() => {
    // Clear previous validation rules
    mappingForm.clearErrors();

    // Register validation rules for each required field
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

  const handleValidateMapping = async (goToStep: (step: IStep) => void) => {
    // Form validation already passed (triggered by handleSubmit in mapping step)
    // Only call transform API
    try {
      const transformResult = await transformMutation.mutateAsync({
        rows,
        mapping,
        typeDetectionStrategy,
        defaultCurrency,
        bank: selectedBank || undefined,
      });

      // Apply default currency to candidates
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

      // Select all valid rows by default
      const validIndices = candidatesWithDefaults
        .filter((c) => c.status === "valid")
        .map((c) => c.rowIndex);
      setSelectedRows(new Set(validIndices));

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
        !candidate.data.occurredAt ||
        !candidate.data.name
      ) {
        continue;
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
    // State
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

    // Computed
    hasUnsavedChanges,
    isBusy,

    // Setters
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

    // Handlers
    handleMappingChange,
    handleResetToSuggested,
    handleSelectAllValid,
    handleExcludeAllInvalid,
    handleValidateMapping,
    handleConfirmImport,
    resetAllState,

    // Mutations
    transformMutation,
    importMutation,

    // Other
    onClose,
  };

  return (
    <TransactionImportContext.Provider value={contextValue}>
      {children}
    </TransactionImportContext.Provider>
  );
}
