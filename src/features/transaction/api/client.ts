import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  buildQueryString,
} from "@/features/shared/api/client";
import type {
  IBulkCreateTransactionInput,
  IBulkCreateTransactionResponse,
  ICurrency,
  ICreateTransactionInput,
  ICsvFieldMapping,
  ICsvImportResponse,
  ICsvMappingValidation,
  ICsvTransformResponse,
  ICsvUploadResponse,
  IPaginatedTransactionsResponse,
  ITransaction,
  ITransactionsQuery,
  IUpdateTransactionInput,
} from "@/features/shared/validation/schemas";
import type { BankEnum } from "../config/banks";

export interface ICsvMappingSuggestion {
  mapping: ICsvFieldMapping;
  metadata?: {
    bank?: BankEnum | null;
  };
}

/**
 * Transaction API Client
 * Client-side functions for interacting with transaction endpoints
 */

export async function getTransactions(
  query?: ITransactionsQuery
): Promise<IPaginatedTransactionsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<IPaginatedTransactionsResponse>(`/transactions${queryString}`);
}

export async function createTransaction(
  input: ICreateTransactionInput
): Promise<ITransaction> {
  return apiPost<ITransaction>("/transactions", input);
}

export async function updateTransaction(
  transactionId: string,
  input: IUpdateTransactionInput
): Promise<ITransaction> {
  return apiPatch<ITransaction>(`/transactions/${transactionId}`, input);
}

export async function deleteTransaction(
  transactionId: string
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/transactions/${transactionId}`);
}

export async function addTagToTransaction(
  transactionId: string,
  tagId: string
): Promise<ITransaction> {
  return apiPost<ITransaction>(
    `/transactions/${transactionId}/tags/${tagId}`,
    {}
  );
}

export async function removeTagFromTransaction(
  transactionId: string,
  tagId: string
): Promise<ITransaction> {
  return apiDelete<ITransaction>(
    `/transactions/${transactionId}/tags/${tagId}`
  );
}

export async function bulkCreateTransactions(
  input: IBulkCreateTransactionInput
): Promise<IBulkCreateTransactionResponse> {
  return apiPost<IBulkCreateTransactionResponse>("/transactions/bulk", input);
}

/**
 * CSV Import API Client Functions
 */

export async function uploadCsvFile(file: File): Promise<ICsvUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/v1/transactions/csv-upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }

  return response.json();
}

export async function getCsvMapping(
  columns: string[],
  bank?: BankEnum
): Promise<ICsvMappingSuggestion> {
  return apiPost<ICsvMappingSuggestion>("/transactions/csv-mapping", {
    columns,
    bank,
  });
}

export async function validateCsvMapping(
  mapping: ICsvFieldMapping,
  typeDetectionStrategy: string,
  defaultCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY",
  bank?: BankEnum
): Promise<ICsvMappingValidation> {
  return apiPost<ICsvMappingValidation>("/transactions/csv-mapping/validate", {
    mapping,
    typeDetectionStrategy,
    defaultCurrency,
    bank,
  });
}

export async function transformCsvRows(
  rows: Record<string, string>[],
  mapping: ICsvFieldMapping,
  typeDetectionStrategy?: string,
  defaultCurrency?: ICurrency,
  bank?: BankEnum
): Promise<ICsvTransformResponse> {
  return apiPost<ICsvTransformResponse>("/transactions/csv-transform", {
    rows,
    mapping,
    typeDetectionStrategy,
    defaultCurrency,
    bank,
  });
}

export async function importCsvTransactions(
  transactions: ICreateTransactionInput[]
): Promise<ICsvImportResponse> {
  return apiPost<ICsvImportResponse>("/transactions/csv-import", {
    transactions,
  });
}
