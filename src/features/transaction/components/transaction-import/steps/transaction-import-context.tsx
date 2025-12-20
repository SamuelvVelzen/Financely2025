"use client";

import type {
  ICreateTransactionInput,
  ICsvCandidateTransaction,
  ICsvFieldMapping,
  ICurrency,
} from "@/features/shared/validation/schemas";
import { useToast } from "@/features/ui/toast";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import type { BankEnum } from "../../../config/banks";
import {
  useGetCsvMapping,
  useImportCsvTransactions,
  useParseCsvRows,
  useValidateCsvMapping,
} from "../../../hooks/useCsvImport";
import { getDefaultStrategyForBank } from "../../../services/csv-type-detection";

export type IStep = "upload" | "mapping" | "review" | "confirm";

export type MappingFormData = {
  defaultCurrency: ICurrency;
  mappings: Record<string, string>;
};

export interface IParseResponse {
  total: number;
  totalValid: number;
  totalInvalid: number;
  hasNext: boolean;
}

export interface ITransactionImportContext {
  // State
  file: File | null;
  columns: string[];
  mapping: ICsvFieldMapping;
  candidates: ICsvCandidateTransaction[];
  selectedRows: Set<number>;
  currentPage: number;
  parseResponse: IParseResponse | null;
  selectedBank: BankEnum | null;
  currentStep: IStep;
  defaultCurrency: ICurrency;
  suggestedMapping: ICsvFieldMapping | undefined;
  typeDetectionStrategy: string;
  mappingForm: UseFormReturn<MappingFormData>;

  // Computed
  hasUnsavedChanges: boolean;
  isBusy: boolean;

  // Setters
  setFile: (file: File | null) => void;
  setColumns: (columns: string[]) => void;
  setMapping: React.Dispatch<React.SetStateAction<ICsvFieldMapping>>;
  setCandidates: (candidates: ICsvCandidateTransaction[]) => void;
  setSelectedRows: (rows: Set<number>) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setParseResponse: (response: IParseResponse | null) => void;
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
  validateMutation: ReturnType<typeof useValidateCsvMapping>;
  parseQuery: ReturnType<typeof useParseCsvRows>;
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

  const [file, setFile] = useState<File | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ICsvFieldMapping>({});
  const [candidates, setCandidates] = useState<ICsvCandidateTransaction[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [parseResponse, setParseResponse] = useState<IParseResponse | null>(
    null
  );
  const [selectedBank, setSelectedBank] = useState<BankEnum | null>(null);
  const [currentStep, setCurrentStep] = useState<IStep>("upload");

  // Derive strategy from bank selection
  const typeDetectionStrategy = getDefaultStrategyForBank(selectedBank);

  // Form for mapping step controls
  const mappingForm = useForm<MappingFormData>({
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
  const validateMutation = useValidateCsvMapping();
  const parseQuery = useParseCsvRows(
    file,
    mapping,
    currentPage,
    50,
    typeDetectionStrategy,
    defaultCurrency,
    selectedBank,
    currentStep === "review" // Only enable parsing when on review step
  );
  const importMutation = useImportCsvTransactions();

  const isBusy =
    isPending || validateMutation.isPending || importMutation.isPending;

  const suggestedMapping = mappingQuery.data?.mapping;

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

  // Load candidates when parse query succeeds
  useEffect(() => {
    if (parseQuery.data) {
      const candidatesWithDefaults = parseQuery.data.candidates.map((c) => {
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
      setParseResponse(parseQuery.data);
      const validIndices = candidatesWithDefaults
        .filter((c) => c.status === "valid")
        .map((c) => c.rowIndex);
      setSelectedRows(new Set(validIndices));
    }
  }, [parseQuery.data, defaultCurrency]);

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
    try {
      const result = await validateMutation.mutateAsync({
        mapping,
        typeDetectionStrategy,
        defaultCurrency,
        bank: selectedBank || undefined,
      });
      if (result.valid) {
        goToStep("review");
      } else {
        alert(`Missing required fields: ${result.missingFields.join(", ")}`);
      }
    } catch (error) {
      console.error("Validation failed:", error);
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
    file,
    columns,
    mapping,
    candidates,
    selectedRows,
    currentPage,
    parseResponse,
    selectedBank,
    currentStep,
    defaultCurrency,
    suggestedMapping,
    typeDetectionStrategy,
    mappingForm,

    // Computed
    hasUnsavedChanges,
    isBusy,

    // Setters
    setFile,
    setColumns,
    setMapping,
    setCandidates,
    setSelectedRows,
    setCurrentPage,
    setParseResponse,
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
    validateMutation,
    parseQuery,
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
