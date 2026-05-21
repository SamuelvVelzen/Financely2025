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
  ICreateTransactionInput,
  ICsvFieldMapping,
  ICsvImportResponse,
  ICsvTransformResponse,
  ICsvUploadResponse,
  ICurrency,
  IPaginatedTransactionsResponse,
  ITransaction,
  ITransactionsQuery,
  IUpdateTransactionInput,
} from "@/features/shared/validation/schemas";
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import type { BankEnum } from "../config/banks";

const API_V1_BASE =
  typeof window !== "undefined" ? "/api/v1" : "http://localhost:3000/api/v1";

export interface ICsvMappingSuggestion {
  mapping: ICsvFieldMapping;
  metadata?: {
    bank?: BankEnum | null;
  };
}

/**
 * Transaction API Client (workspace-scoped paths: /api/v1/:workspaceId/transactions/...)
 */

export async function getTransactions(
  workspaceId: IWorkspaceId,
  query?: ITransactionsQuery
): Promise<IPaginatedTransactionsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<IPaginatedTransactionsResponse>(
    `${workspaceApiV1Path(workspaceId, "transactions")}${queryString}`
  );
}

export async function createTransaction(
  workspaceId: IWorkspaceId,
  input: ICreateTransactionInput
): Promise<ITransaction> {
  return apiPost<ITransaction>(
    workspaceApiV1Path(workspaceId, "transactions"),
    input
  );
}

export async function updateTransaction(
  workspaceId: IWorkspaceId,
  transactionId: string,
  input: IUpdateTransactionInput
): Promise<ITransaction> {
  return apiPatch<ITransaction>(
    workspaceApiV1Path(workspaceId, `transactions/${transactionId}`),
    input
  );
}

export async function deleteTransaction(
  workspaceId: IWorkspaceId,
  transactionId: string
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, `transactions/${transactionId}`)
  );
}

export async function addTagToTransaction(
  workspaceId: IWorkspaceId,
  transactionId: string,
  tagId: string
): Promise<ITransaction> {
  return apiPost<ITransaction>(
    workspaceApiV1Path(
      workspaceId,
      `transactions/${transactionId}/tags/${tagId}`
    ),
    {}
  );
}

export async function removeTagFromTransaction(
  workspaceId: IWorkspaceId,
  transactionId: string,
  tagId: string
): Promise<ITransaction> {
  return apiDelete<ITransaction>(
    workspaceApiV1Path(
      workspaceId,
      `transactions/${transactionId}/tags/${tagId}`
    )
  );
}

export async function bulkCreateTransactions(
  workspaceId: IWorkspaceId,
  input: IBulkCreateTransactionInput
): Promise<IBulkCreateTransactionResponse> {
  return apiPost<IBulkCreateTransactionResponse>(
    workspaceApiV1Path(workspaceId, "transactions/bulk"),
    input
  );
}

export async function uploadCsvFile(
  workspaceId: IWorkspaceId,
  file: File
): Promise<ICsvUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_V1_BASE}${workspaceApiV1Path(workspaceId, "transactions/csv-upload")}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }

  return response.json();
}

export async function getCsvMapping(
  workspaceId: IWorkspaceId,
  columns: string[],
  bank?: BankEnum
): Promise<ICsvMappingSuggestion> {
  return apiPost<ICsvMappingSuggestion>(
    workspaceApiV1Path(workspaceId, "transactions/csv-mapping"),
    {
      columns,
      bank,
    }
  );
}

export async function transformCsvRows(
  workspaceId: IWorkspaceId,
  rows: Record<string, string>[],
  mapping: ICsvFieldMapping,
  typeDetectionStrategy?: string,
  defaultCurrency?: ICurrency,
  bank?: BankEnum
): Promise<ICsvTransformResponse> {
  return apiPost<ICsvTransformResponse>(
    workspaceApiV1Path(workspaceId, "transactions/csv-transform"),
    {
      rows,
      mapping,
      typeDetectionStrategy,
      defaultCurrency,
      bank,
    }
  );
}

export async function importCsvTransactions(
  workspaceId: IWorkspaceId,
  transactions: ICreateTransactionInput[]
): Promise<ICsvImportResponse> {
  return apiPost<ICsvImportResponse>(
    workspaceApiV1Path(workspaceId, "transactions/csv-import"),
    {
      transactions,
    }
  );
}
