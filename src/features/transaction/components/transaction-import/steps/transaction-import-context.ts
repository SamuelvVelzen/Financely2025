import type {
  ICreateTransactionInput,
  ICsvCandidateTransaction,
  ICsvFieldMapping,
  ICurrency,
} from "@/features/shared/validation/schemas";
import { type UseFormReturn } from "react-hook-form";
import { createContext, useContext } from "react";
import type { BankEnum } from "../../../config/banks";
import type { ITransactionFieldName } from "../../../config/transaction-fields";
import type {
  useImportCsvTransactions,
  useTransformCsvRows,
} from "../../../hooks/useCsvImport";

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
  rows: Record<string, string>[];
  columns: string[];
  mapping: ICsvFieldMapping;
  candidates: ICsvCandidateTransaction[];
  selectedRows: Set<number>;
  currentPage: number;
  transformResponse: ITransformResponse | null;
  selectedBank: BankEnum;
  currentStep: IStep;
  defaultCurrency: ICurrency;
  suggestedMapping: ICsvFieldMapping | undefined;
  typeDetectionStrategy: string;
  mappingForm: UseFormReturn<MappingFormData>;
  requiredMappingFields: ITransactionFieldName[];
  hasUnsavedChanges: boolean;
  isBusy: boolean;
  uploadResetCounter: number;
  setRows: (rows: Record<string, string>[]) => void;
  setColumns: (columns: string[]) => void;
  setMapping: React.Dispatch<React.SetStateAction<ICsvFieldMapping>>;
  setCandidates: React.Dispatch<
    React.SetStateAction<ICsvCandidateTransaction[]>
  >;
  setSelectedRows: (rows: Set<number>) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  setTransformResponse: (response: ITransformResponse | null) => void;
  setSelectedBank: (bank: BankEnum) => void;
  setCurrentStep: (step: IStep) => void;
  setIsPending: (isPending: boolean) => void;
  handleMappingChange: (field: string, column: string | null) => void;
  handleMappingFieldChange: (field: string, column: string | null) => void;
  handleResetToSuggested: (fieldName: string) => void;
  handleSelectAllValid: () => void;
  handleExcludeAllInvalid: () => void;
  handleValidateMapping: (goToStep: (step: IStep) => void) => Promise<void>;
  handleConfirmImport: () => Promise<void>;
  updateCandidate: (
    rowIndex: number,
    updates: Partial<ICreateTransactionInput> & {
      tagSuggestions?: ICsvCandidateTransaction["tagSuggestions"];
    },
  ) => void;
  resetAllState: () => void;
  transformMutation: ReturnType<typeof useTransformCsvRows>;
  importMutation: ReturnType<typeof useImportCsvTransactions>;
  onCloseSuccessful: () => void;
}

export const TransactionImportContext =
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
