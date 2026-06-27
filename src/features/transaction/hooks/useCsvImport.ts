import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import {
  buildOptimisticTransaction,
  prependToPaginatedCaches,
  snapshotForPrefixes,
  transactionListPrefixes,
} from "@/features/shared/offline/optimistic-cache";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ICurrency,
  ICsvFieldMapping,
  ICsvImportResponse,
  ICsvTransformResponse,
  ICsvUploadResponse,
  ICreateTransactionInput,
} from "@/features/shared/validation/schemas";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import {
  getCsvMapping,
  importCsvTransactions,
  transformCsvRows,
  uploadCsvFile,
  type ICsvMappingSuggestion,
} from "../api/client";
import type { BankEnum } from "../config/banks";
import { useQueryClient } from "@tanstack/react-query";

function requireWorkspaceId(id: number | null): number {
  if (id == null) {
    throw new Error("Workspace is required");
  }
  return id;
}

export function useUploadCsvFile() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ICsvUploadResponse, Error, File>({
    mutationFn: (file) =>
      uploadCsvFile(requireWorkspaceId(workspaceId), file),
    getOfflineQueuedToast: () => ({
      title: "CSV upload queued",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useGetCsvMapping(
  columns: string[] | undefined,
  bank?: BankEnum | null,
) {
  const workspaceId = useNavWorkspaceId();
  const enabled =
    !!columns && columns.length > 0 && workspaceId != null;
  return useFinQuery<ICsvMappingSuggestion, Error>({
    queryKey: enabled
      ? ["csv-mapping", workspaceId, columns, bank]
      : (["csv-mapping", "disabled"] as const),
    queryFn: () => {
      if (!columns || columns.length === 0) {
        throw new Error("Columns are required");
      }
      return getCsvMapping(
        requireWorkspaceId(workspaceId),
        columns,
        bank || undefined,
      );
    },
    enabled,
    staleTime: Infinity,
  });
}

export function useTransformCsvRows() {
  const workspaceId = useNavWorkspaceId();
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
    mutationFn: ({
      rows,
      mapping,
      typeDetectionStrategy,
      defaultCurrency,
      bank,
    }) =>
      transformCsvRows(
        requireWorkspaceId(workspaceId),
        rows,
        mapping,
        typeDetectionStrategy,
        defaultCurrency,
        bank,
      ),
    getOfflineQueuedToast: () => ({
      title: "CSV rows transformed",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useImportCsvTransactions() {
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<ICsvImportResponse, Error, ICreateTransactionInput[]>({
    mutationFn: (transactions) =>
      importCsvTransactions(requireWorkspaceId(workspaceId), transactions),
    invalidateQueries: [
      () => queryKeys.transactions(wid),
      () => queryKeys.expenses(wid),
      () => queryKeys.incomes(wid),
    ],
    onMutate: async (transactions) => {
      const prefixes = transactionListPrefixes(wid);
      const snapshot = await snapshotForPrefixes(queryClient, prefixes);
      for (const tx of transactions) {
        prependToPaginatedCaches(
          queryClient,
          prefixes,
          buildOptimisticTransaction(tx),
        );
      }
      return { snapshot };
    },
    getOfflineQueuedToast: (transactions) => ({
      title: `${transactions.length} transaction${transactions.length === 1 ? "" : "s"} queued for import`,
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
