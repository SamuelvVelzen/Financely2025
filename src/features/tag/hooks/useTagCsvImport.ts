import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ITagCsvFieldMapping,
  ITagCsvImportResponse,
  ITagCsvMappingValidation,
  ITagCsvParseResponse,
  ITagCsvUploadResponse,
} from "@/features/shared/validation/schemas";
import {
  getTagCsvMapping,
  importTagCsv,
  parseTagCsvRows,
  uploadTagCsvFile,
  validateTagCsvMapping,
} from "../api/client";

/**
 * Upload tag CSV file mutation
 */
export function useUploadTagCsvFile() {
  return useFinMutation<ITagCsvUploadResponse, Error, File>({
    mutationFn: uploadTagCsvFile,
  });
}

/**
 * Get auto-detected tag CSV mapping query
 */
export function useGetTagCsvMapping(columns: string[] | undefined) {
  return useFinQuery<ITagCsvFieldMapping, Error>({
    queryKey: ["tag-csv-mapping", columns],
    queryFn: () => {
      if (!columns || columns.length === 0) {
        throw new Error("Columns are required");
      }
      return getTagCsvMapping(columns);
    },
    enabled: !!columns && columns.length > 0,
    staleTime: Infinity,
  });
}

/**
 * Validate tag CSV mapping mutation
 */
export function useValidateTagCsvMapping() {
  return useFinMutation<ITagCsvMappingValidation, Error, ITagCsvFieldMapping>({
    mutationFn: validateTagCsvMapping,
  });
}

/**
 * Parse tag CSV rows query (paginated)
 */
export function useParseTagCsvRows(
  file: File | null,
  mapping: ITagCsvFieldMapping | null,
  page: number = 1,
  limit: number = 50
) {
  return useFinQuery<ITagCsvParseResponse, Error>({
    queryKey: ["tag-csv-parse", file?.name, mapping, page, limit],
    queryFn: () => {
      if (!file || !mapping) {
        throw new Error("File and mapping are required");
      }
      return parseTagCsvRows(file, mapping, page, limit);
    },
    enabled: !!file && !!mapping,
    staleTime: 30 * 1000,
  });
}

/**
 * Import tag CSV mutation
 * Invalidates tags query on success
 */
export function useImportTagCsv() {
  return useFinMutation<ITagCsvImportResponse, Error, any[]>({
    mutationFn: importTagCsv,
    invalidateQueries: [queryKeys.tags],
  });
}
