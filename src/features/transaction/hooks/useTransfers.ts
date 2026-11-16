import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  IBulkDeleteTransactionsInput,
  IBulkUpdateTransactionTypeInput,
  ICreateLinkedTransferInput,
  IPairTransferInput,
} from "@/features/shared/validation/schemas";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useQueryClient } from "@tanstack/react-query";
import {
  bulkDeleteTransactions,
  bulkUpdateTransactionType,
  createLinkedTransfer,
  getTransferSuggestions,
  pairTransfer,
} from "../api/transfer-client";

function requireWorkspaceId(id: number | null): number {
  if (id == null) throw new Error("Workspace is required");
  return id;
}

function invalidateTransactions(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: number,
) {
  void queryClient.invalidateQueries({
    queryKey: ["transactions", workspaceId],
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.ledgerAccounts(workspaceId),
  });
}

export function useTransferSuggestions(
  transactionId: string | undefined,
  enabled = true,
) {
  const workspaceId = useNavWorkspaceId();
  return useFinQuery({
    queryKey: [
      "transfer-suggestions",
      workspaceId,
      transactionId,
    ] as const,
    queryFn: () =>
      getTransferSuggestions(
        requireWorkspaceId(workspaceId),
        transactionId!,
      ),
    enabled: enabled && workspaceId != null && Boolean(transactionId),
    staleTime: 30_000,
  });
}

export function useCreateLinkedTransfer() {
  const workspaceId = useNavWorkspaceId();
  const queryClient = useQueryClient();
  return useFinMutation({
    mutationFn: (input: ICreateLinkedTransferInput) =>
      createLinkedTransfer(requireWorkspaceId(workspaceId), input),
    onSuccess: () => {
      if (workspaceId != null) {
        invalidateTransactions(queryClient, workspaceId);
      }
    },
  });
}

export function usePairTransfer() {
  const workspaceId = useNavWorkspaceId();
  const queryClient = useQueryClient();
  return useFinMutation({
    mutationFn: ({
      transactionId,
      input,
    }: {
      transactionId: string;
      input: IPairTransferInput;
    }) =>
      pairTransfer(requireWorkspaceId(workspaceId), transactionId, input),
    onSuccess: () => {
      if (workspaceId != null) {
        invalidateTransactions(queryClient, workspaceId);
      }
    },
  });
}

export function useBulkDeleteTransactions() {
  const workspaceId = useNavWorkspaceId();
  const queryClient = useQueryClient();
  return useFinMutation({
    mutationFn: (input: IBulkDeleteTransactionsInput) =>
      bulkDeleteTransactions(requireWorkspaceId(workspaceId), input),
    onSuccess: () => {
      if (workspaceId != null) {
        invalidateTransactions(queryClient, workspaceId);
      }
    },
  });
}

export function useBulkUpdateTransactionType() {
  const workspaceId = useNavWorkspaceId();
  const queryClient = useQueryClient();
  return useFinMutation({
    mutationFn: (input: IBulkUpdateTransactionTypeInput) =>
      bulkUpdateTransactionType(requireWorkspaceId(workspaceId), input),
    onSuccess: () => {
      if (workspaceId != null) {
        invalidateTransactions(queryClient, workspaceId);
      }
    },
  });
}