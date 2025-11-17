import {
  useFinMutation,
  useFinQuery,
} from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  TagCsvFieldMapping,
  TagCsvImportResponse,
  TagCsvMappingValidation,
  TagCsvParseResponse,
  TagCsvUploadResponse,
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
  return useFinMutation<TagCsvUploadResponse, Error, File>({
    mutationFn: uploadTagCsvFile,
  });
}

/**
 * Get auto-detected tag CSV mapping query
 */
export function useGetTagCsvMapping(columns: string[] | undefined) {
  return useFinQuery<TagCsvFieldMapping, Error>({
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
  return useFinMutation<TagCsvMappingValidation, Error, TagCsvFieldMapping>({
    mutationFn: validateTagCsvMapping,
  });
}

/**
 * Parse tag CSV rows query (paginated)
 */
export function useParseTagCsvRows(
  file: File | null,
  mapping: TagCsvFieldMapping | null,
  page: number = 1,
  limit: number = 50
) {
  return useFinQuery<TagCsvParseResponse, Error>({
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
  return useFinMutation<TagCsvImportResponse, Error, any[]>({
    mutationFn: importTagCsv,
    invalidateQueries: [queryKeys.tags],
  });
}

