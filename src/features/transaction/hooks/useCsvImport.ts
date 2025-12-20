import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ICurrency,
  ICsvFieldMapping,
  ICsvImportResponse,
  ICsvTransformResponse,
  ICsvUploadResponse,
} from "@/features/shared/validation/schemas";
import {
  getCsvMapping,
  importCsvTransactions,
  transformCsvRows,
  uploadCsvFile,
  type ICsvMappingSuggestion,
} from "../api/client";
import type { BankEnum } from "../config/banks";

/**
 * Upload CSV file mutation
 */
export function useUploadCsvFile() {
  return useFinMutation<ICsvUploadResponse, Error, File>({
    mutationFn: uploadCsvFile,
  });
}

/**
 * Get auto-detected CSV mapping query
 */
export function useGetCsvMapping(
  columns: string[] | undefined,
  bank?: BankEnum | null
) {
  return useFinQuery<ICsvMappingSuggestion, Error>({
    queryKey: ["csv-mapping", columns, bank],
    queryFn: () => {
      if (!columns || columns.length === 0) {
        throw new Error("Columns are required");
      }
      return getCsvMapping(columns, bank || undefined);
    },
    enabled: !!columns && columns.length > 0,
    staleTime: Infinity, // Mapping doesn't change
  });
}

/**
 * Transform CSV rows mutation
 * Transforms raw CSV rows into candidate transactions using the provided mapping
 */
export function useTransformCsvRows() {
  return useFinMutation<
    ICsvTransformResponse,
    Error,
    {
      rows: Record<string, string>[];
      mapping: ICsvFieldMapping;
      typeDetectionStrategy?: string;
      defaultCurrency?: ICurrency;
      bank?: BankEnum;
    }
  >({
    mutationFn: ({ rows, mapping, typeDetectionStrategy, defaultCurrency, bank }) =>
      transformCsvRows(rows, mapping, typeDetectionStrategy, defaultCurrency, bank),
  });
}

/**
 * Import CSV transactions mutation
 * Invalidates transactions, expenses, and incomes queries on success
 */
export function useImportCsvTransactions() {
  return useFinMutation<ICsvImportResponse, Error, any[]>({
    mutationFn: importCsvTransactions,
    invalidateQueries: [
      queryKeys.transactions,
      queryKeys.expenses,
      queryKeys.incomes,
    ],
  });
}
