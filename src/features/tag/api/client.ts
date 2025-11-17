import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  buildQueryString,
} from "@/features/shared/api/client";
import type {
  BulkCreateTagInput,
  BulkCreateTagResponse,
  CreateTagInput,
  Tag,
  TagCsvFieldMapping,
  TagCsvImportResponse,
  TagCsvMappingValidation,
  TagCsvParseResponse,
  TagCsvUploadResponse,
  TagsQuery,
  TagsResponse,
  UpdateTagInput,
} from "@/features/shared/validation/schemas";

/**
 * Tag API Client
 * Client-side functions for interacting with tag endpoints
 */

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

export async function bulkCreateTags(
  input: BulkCreateTagInput
): Promise<BulkCreateTagResponse> {
  return apiPost<BulkCreateTagResponse>("/tags/bulk", input);
}

/**
 * Tag CSV Import API Client Functions
 */

export async function uploadTagCsvFile(file: File): Promise<TagCsvUploadResponse> {
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
): Promise<TagCsvFieldMapping> {
  return apiPost<TagCsvFieldMapping>("/tags/csv-mapping", { columns });
}

export async function validateTagCsvMapping(
  mapping: TagCsvFieldMapping
): Promise<TagCsvMappingValidation> {
  return apiPost<TagCsvMappingValidation>(
    "/tags/csv-mapping/validate",
    { mapping }
  );
}

export async function parseTagCsvRows(
  file: File,
  mapping: TagCsvFieldMapping,
  page: number = 1,
  limit: number = 50
): Promise<TagCsvParseResponse> {
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
  tags: CreateTagInput[]
): Promise<TagCsvImportResponse> {
  return apiPost<TagCsvImportResponse>("/tags/csv-import", {
    tags,
  });
}
