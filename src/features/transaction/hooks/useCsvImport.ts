import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ICsvFieldMapping,
  ICsvImportResponse,
  ICsvMappingValidation,
  ICsvParseResponse,
  ICsvUploadResponse,
} from "@/features/shared/validation/schemas";
import {
  getCsvMapping,
  importCsvTransactions,
  parseCsvRows,
  uploadCsvFile,
  validateCsvMapping,
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
 * Validate CSV mapping mutation
 */
export function useValidateCsvMapping() {
  return useFinMutation<
    ICsvMappingValidation,
    Error,
    {
      mapping: ICsvFieldMapping;
      typeDetectionStrategy: string;
      defaultCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY";
      bank?: BankEnum;
    }
  >({
    mutationFn: ({ mapping, typeDetectionStrategy, defaultCurrency, bank }) =>
      validateCsvMapping(mapping, typeDetectionStrategy, defaultCurrency, bank),
  });
}

/**
 * Parse CSV rows query (paginated)
 */
export function useParseCsvRows(
  file: File | null,
  mapping: ICsvFieldMapping | null,
  page: number = 1,
  limit: number = 50,
  typeDetectionStrategy: string,
  defaultCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY",
  bank?: BankEnum | null
) {
  return useFinQuery<ICsvParseResponse, Error>({
    queryKey: [
      "csv-parse",
      file?.name,
      mapping,
      page,
      limit,
      typeDetectionStrategy,
      defaultCurrency,
      bank,
    ],
    queryFn: () => {
      if (!file || !mapping) {
        throw new Error("File and mapping are required");
      }
      return parseCsvRows(
        file,
        mapping,
        page,
        limit,
        typeDetectionStrategy,
        defaultCurrency,
        bank || undefined
      );
    },
    enabled: !!file && !!mapping && false,
    staleTime: 30 * 1000, // 30 seconds
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
