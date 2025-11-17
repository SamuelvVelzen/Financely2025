import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  buildQueryString,
} from "@/features/shared/api/client";
import type {
  BulkCreateTransactionInput,
  BulkCreateTransactionResponse,
  CreateTransactionInput,
  PaginatedTransactionsResponse,
  Transaction,
  TransactionsQuery,
  UpdateTransactionInput,
} from "@/features/shared/validation/schemas";

/**
 * Transaction API Client
 * Client-side functions for interacting with transaction endpoints
 */

export async function getTransactions(
  query?: TransactionsQuery
): Promise<PaginatedTransactionsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<PaginatedTransactionsResponse>(`/transactions${queryString}`);
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<Transaction> {
  return apiPost<Transaction>("/transactions", input);
}

export async function updateTransaction(
  transactionId: string,
  input: UpdateTransactionInput
): Promise<Transaction> {
  return apiPatch<Transaction>(`/transactions/${transactionId}`, input);
}

export async function deleteTransaction(
  transactionId: string
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/transactions/${transactionId}`);
}

export async function addTagToTransaction(
  transactionId: string,
  tagId: string
): Promise<Transaction> {
  return apiPost<Transaction>(
    `/transactions/${transactionId}/tags/${tagId}`,
    {}
  );
}

export async function removeTagFromTransaction(
  transactionId: string,
  tagId: string
): Promise<Transaction> {
  return apiDelete<Transaction>(`/transactions/${transactionId}/tags/${tagId}`);
}

export async function bulkCreateTransactions(
  input: BulkCreateTransactionInput
): Promise<BulkCreateTransactionResponse> {
  return apiPost<BulkCreateTransactionResponse>("/transactions/bulk", input);
}
