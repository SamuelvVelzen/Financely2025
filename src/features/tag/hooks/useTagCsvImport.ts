import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ICreateTagInput,
  ITagCsvFieldMapping,
  ITagCsvImportResponse,
  ITagCsvMappingValidation,
  ITagCsvParseResponse,
  ITagCsvUploadResponse,
} from "@/features/shared/validation/schemas";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import {
  getTagCsvMapping,
  importTagCsv,
  parseTagCsvRows,
  uploadTagCsvFile,
  validateTagCsvMapping,
} from "../api/client";

function requireWorkspaceId(id: number | null): number {
  if (id == null) {
    throw new Error("Workspace is required");
  }
  return id;
}

export function useUploadTagCsvFile() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ITagCsvUploadResponse, Error, File>({
    mutationFn: (file) =>
      uploadTagCsvFile(requireWorkspaceId(workspaceId), file),
  });
}

export function useGetTagCsvMapping(columns: string[] | undefined) {
  const workspaceId = useNavWorkspaceId();
  const enabled =
    !!columns &&
    columns.length > 0 &&
    workspaceId != null;
  return useFinQuery<ITagCsvFieldMapping, Error>({
    queryKey: enabled
      ? ["tag-csv-mapping", workspaceId, columns]
      : (["tag-csv-mapping", "disabled"] as const),
    queryFn: () => {
      if (!columns || columns.length === 0) {
        throw new Error("Columns are required");
      }
      return getTagCsvMapping(requireWorkspaceId(workspaceId), columns);
    },
    enabled,
    staleTime: Infinity,
  });
}

export function useValidateTagCsvMapping() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ITagCsvMappingValidation, Error, ITagCsvFieldMapping>({
    mutationFn: (mapping) =>
      validateTagCsvMapping(requireWorkspaceId(workspaceId), mapping),
  });
}

export function useParseTagCsvRows(
  file: File | null,
  mapping: ITagCsvFieldMapping | null,
  page: number = 1,
  limit: number = 50,
) {
  const workspaceId = useNavWorkspaceId();
  const enabled = !!file && !!mapping && workspaceId != null;
  return useFinQuery<ITagCsvParseResponse, Error>({
    queryKey: enabled
      ? ["tag-csv-parse", workspaceId, file?.name, mapping, page, limit]
      : (["tag-csv-parse", "disabled"] as const),
    queryFn: () => {
      if (!file || !mapping) {
        throw new Error("File and mapping are required");
      }
      return parseTagCsvRows(
        requireWorkspaceId(workspaceId),
        file,
        mapping,
        page,
        limit,
      );
    },
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useImportTagCsv() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ITagCsvImportResponse, Error, ICreateTagInput[]>({
    mutationFn: (tags) =>
      importTagCsv(requireWorkspaceId(workspaceId), tags),
    invalidateQueries: [() => queryKeys.tags(workspaceId!)],
  });
}
