import { apiGet, apiPost } from "@/features/shared/api/client";
import type {
  IBulkDeleteTransactionsInput,
  IBulkDeleteTransactionsResponse,
  IBulkUpdateTransactionTypeInput,
  ICreateLinkedTransferInput,
  IPairTransferInput,
  ITransaction,
  ITransferSuggestionsResponse,
} from "@/features/shared/validation/schemas";
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export type ILinkedTransferResult = {
  outLeg: ITransaction;
  inLeg: ITransaction;
};

export async function createLinkedTransfer(
  workspaceId: IWorkspaceId,
  input: ICreateLinkedTransferInput,
): Promise<ILinkedTransferResult> {
  return apiPost<ILinkedTransferResult>(
    workspaceApiV1Path(workspaceId, "transfers"),
    input,
  );
}

export async function getTransferSuggestions(
  workspaceId: IWorkspaceId,
  transactionId: string,
): Promise<ITransferSuggestionsResponse> {
  return apiGet<ITransferSuggestionsResponse>(
    workspaceApiV1Path(
      workspaceId,
      `transactions/${transactionId}/transfer-suggestions`,
    ),
  );
}

export async function pairTransfer(
  workspaceId: IWorkspaceId,
  transactionId: string,
  input: IPairTransferInput,
): Promise<ILinkedTransferResult> {
  return apiPost<ILinkedTransferResult>(
    workspaceApiV1Path(
      workspaceId,
      `transactions/${transactionId}/pair-transfer`,
    ),
    input,
  );
}

export async function bulkUpdateTransactionType(
  workspaceId: IWorkspaceId,
  input: IBulkUpdateTransactionTypeInput,
): Promise<{ updated: number }> {
  return apiPost<{ updated: number }>(
    workspaceApiV1Path(workspaceId, "transactions/bulk-update-type"),
    input,
  );
}

export async function bulkDeleteTransactions(
  workspaceId: IWorkspaceId,
  input: IBulkDeleteTransactionsInput,
): Promise<IBulkDeleteTransactionsResponse> {
  return apiPost<IBulkDeleteTransactionsResponse>(
    workspaceApiV1Path(workspaceId, "transactions/bulk-delete"),
    input,
  );
}