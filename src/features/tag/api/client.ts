import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  buildQueryString,
} from "@/features/shared/api/client";
import type {
  IBulkCreateTagInput,
  IBulkCreateTagResponse,
  ICreateTagInput,
  IReorderTagsInput,
  ITag,
  ITagCsvFieldMapping,
  ITagCsvImportResponse,
  ITagCsvMappingValidation,
  ITagCsvParseResponse,
  ITagCsvUploadResponse,
  ITagsQuery,
  ITagsResponse,
  IUpdateTagInput,
} from "@/features/shared/validation/schemas";

/**
 * Tag API Client
 * Client-side functions for interacting with tag endpoints
 */

export async function getTags(query?: ITagsQuery): Promise<ITagsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<ITagsResponse>(`/tags${queryString}`);
}

export async function createTag(input: ICreateTagInput): Promise<ITag> {
  return apiPost<ITag>("/tags", input);
}

export async function updateTag(
  tagId: string,
  input: IUpdateTagInput
): Promise<ITag> {
  return apiPatch<ITag>(`/tags/${tagId}`, input);
}

export async function deleteTag(tagId: string): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(`/tags/${tagId}`);
}

export async function bulkCreateTags(
  input: IBulkCreateTagInput
): Promise<IBulkCreateTagResponse> {
  return apiPost<IBulkCreateTagResponse>("/tags/bulk", input);
}

export async function reorderTags(
  input: IReorderTagsInput
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>("/tags/reorder", input);
}

/**
 * Tag CSV Import API Client Functions
 */

export async function uploadTagCsvFile(
  file: File
): Promise<ITagCsvUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/v1/tags/csv-upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }

  return response.json();
}

export async function getTagCsvMapping(
  columns: string[]
): Promise<ITagCsvFieldMapping> {
  return apiPost<ITagCsvFieldMapping>("/tags/csv-mapping", { columns });
}

export async function validateTagCsvMapping(
  mapping: ITagCsvFieldMapping
): Promise<ITagCsvMappingValidation> {
  return apiPost<ITagCsvMappingValidation>("/tags/csv-mapping/validate", {
    mapping,
  });
}

export async function parseTagCsvRows(
  file: File,
  mapping: ITagCsvFieldMapping,
  page: number = 1,
  limit: number = 50
): Promise<ITagCsvParseResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mapping", JSON.stringify(mapping));
  formData.append("page", page.toString());
  formData.append("limit", limit.toString());

  const response = await fetch("/api/v1/tags/csv-parse", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Parse failed");
  }

  return response.json();
}

export async function importTagCsv(
  tags: ICreateTagInput[]
): Promise<ITagCsvImportResponse> {
  return apiPost<ITagCsvImportResponse>("/tags/csv-import", {
    tags,
  });
}
