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
  CsvFieldMapping,
  CsvImportResponse,
  CsvMappingValidation,
  CsvParseResponse,
  CsvUploadResponse,
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

/**
 * CSV Import API Client Functions
 */

export async function uploadCsvFile(file: File): Promise<CsvUploadResponse> {
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
  columns: string[]
): Promise<CsvFieldMapping> {
  return apiPost<CsvFieldMapping>("/transactions/csv-mapping", { columns });
}

export async function validateCsvMapping(
  mapping: CsvFieldMapping,
  defaultType?: "EXPENSE" | "INCOME",
  typeDetectionStrategy?: string,
  defaultCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY"
): Promise<CsvMappingValidation> {
  return apiPost<CsvMappingValidation>("/transactions/csv-mapping/validate", {
    mapping,
    defaultType,
    typeDetectionStrategy,
    defaultCurrency,
  });
}

export async function parseCsvRows(
  file: File,
  mapping: CsvFieldMapping,
  page: number = 1,
  limit: number = 50,
  defaultType?: "EXPENSE" | "INCOME",
  typeDetectionStrategy?: string,
  defaultCurrency?: "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY"
): Promise<CsvParseResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mapping", JSON.stringify(mapping));
  formData.append("page", page.toString());
  formData.append("limit", limit.toString());
  if (defaultType) {
    formData.append("defaultType", defaultType);
  }
  if (typeDetectionStrategy) {
    formData.append("typeDetectionStrategy", typeDetectionStrategy);
  }
  if (defaultCurrency) {
    formData.append("defaultCurrency", defaultCurrency);
  }

  const response = await fetch("/api/v1/transactions/csv-parse", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Parse failed");
  }

  return response.json();
}

export async function importCsvTransactions(
  transactions: CreateTransactionInput[]
): Promise<CsvImportResponse> {
  return apiPost<CsvImportResponse>("/transactions/csv-import", {
    transactions,
  });
}
