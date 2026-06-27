import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import {
  buildOptimisticTag,
  prependToDataListCaches,
  snapshotForPrefixes,
} from "@/features/shared/offline/optimistic-cache";
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
import { useQueryClient } from "@tanstack/react-query";

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
    getOfflineQueuedToast: () => ({
      title: "CSV upload queued",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
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
    getOfflineQueuedToast: () => ({
      title: "CSV mapping validated",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<ITagCsvImportResponse, Error, ICreateTagInput[]>({
    mutationFn: (tags) =>
      importTagCsv(requireWorkspaceId(workspaceId), tags),
    invalidateQueries: [() => queryKeys.tags(wid)],
    onMutate: async (tags) => {
      const prefix = ["tags", wid] as const;
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      for (const tag of tags) {
        prependToDataListCaches(queryClient, [prefix], buildOptimisticTag(tag));
      }
      return { snapshot };
    },
    getOfflineQueuedToast: (tags) => ({
      title: `${tags.length} tag${tags.length === 1 ? "" : "s"} queued for import`,
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
