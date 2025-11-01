import type {
  CreateTagInput,
  CreateTransactionInput,
  PaginatedTransactionsResponse,
  Tag,
  TagsQuery,
  TagsResponse,
  Transaction,
  TransactionsQuery,
  UpdateTagInput,
  UpdateTransactionInput,
  UserResponse,
} from "@/lib/validation/schemas";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  buildQueryString,
} from "./client";

/**
 * API Endpoints
 * Type-safe API functions
 */

// ============================================================================
// User endpoints
// ============================================================================

export async function getMe(): Promise<UserResponse> {
  return apiGet<UserResponse>("/me");
}

// ============================================================================
// Tag endpoints
// ============================================================================

export async function getTags(query?: TagsQuery): Promise<TagsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<TagsResponse>(`/tags${queryString}`);
}

export async function createTag(input: CreateTagInput): Promise<Tag> {
  return apiPost<Tag>("/tags", input);
}

export async function updateTag(
  tagId: string,
  input: UpdateTagInput
): Promise<Tag> {
  return apiPatch<Tag>(`/tags/${tagId}`, input);
}

export async function deleteTag(tagId: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/tags/${tagId}`);
}

// ============================================================================
// Transaction endpoints
// ============================================================================

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
