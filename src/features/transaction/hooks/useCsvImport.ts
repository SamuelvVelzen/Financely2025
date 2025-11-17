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
} from "../api/client";

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
export function useGetCsvMapping(columns: string[] | undefined) {
  return useFinQuery<ICsvFieldMapping, Error>({
    queryKey: ["csv-mapping", columns],
    queryFn: () => {
      if (!columns || columns.length === 0) {
        throw new Error("Columns are required");
      }
      return getCsvMapping(columns);
    },
    enabled: !!columns && columns.length > 0,
    staleTime: Infinity, // Mapping doesn't change
  });
}

/**
 * Validate CSV mapping mutation
 */
export function useValidateCsvMapping(defaultType?: "EXPENSE" | "INCOME") {
  return useFinMutation<
    ICsvMappingValidation,
    Error,
    {
      mapping: ICsvFieldMapping;
      defaultType?: "EXPENSE" | "INCOME";
      typeDetectionStrategy?: string;
      defaultCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY";
    }
  >({
    mutationFn: ({
      mapping,
      defaultType: dt,
      typeDetectionStrategy,
      defaultCurrency,
    }) =>
      validateCsvMapping(
        mapping,
        dt || defaultType,
        typeDetectionStrategy,
        defaultCurrency
      ),
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
  defaultType?: "EXPENSE" | "INCOME",
  typeDetectionStrategy?: string,
  defaultCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY"
) {
  return useFinQuery<ICsvParseResponse, Error>({
    queryKey: [
      "csv-parse",
      file?.name,
      mapping,
      page,
      limit,
      defaultType,
      typeDetectionStrategy,
      defaultCurrency,
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
        defaultType,
        typeDetectionStrategy,
        defaultCurrency
      );
    },
    enabled: !!file && !!mapping,
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
