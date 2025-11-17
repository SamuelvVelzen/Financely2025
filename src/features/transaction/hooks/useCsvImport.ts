import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  CsvFieldMapping,
  CsvImportResponse,
  CsvMappingValidation,
  CsvParseResponse,
  CsvUploadResponse,
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
  return useFinMutation<CsvUploadResponse, Error, File>({
    mutationFn: uploadCsvFile,
  });
}

/**
 * Get auto-detected CSV mapping query
 */
export function useGetCsvMapping(columns: string[] | undefined) {
  return useFinQuery<CsvFieldMapping, Error>({
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
    CsvMappingValidation,
    Error,
    {
      mapping: CsvFieldMapping;
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
  mapping: CsvFieldMapping | null,
  page: number = 1,
  limit: number = 50,
  defaultType?: "EXPENSE" | "INCOME",
  typeDetectionStrategy?: string,
  defaultCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY"
) {
  return useFinQuery<CsvParseResponse, Error>({
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
  return useFinMutation<CsvImportResponse, Error, any[]>({
    mutationFn: importCsvTransactions,
    invalidateQueries: [
      queryKeys.transactions,
      queryKeys.expenses,
      queryKeys.incomes,
    ],
  });
}
