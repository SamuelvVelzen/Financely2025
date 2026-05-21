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
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

const API_V1_BASE =
  typeof window !== "undefined" ? "/api/v1" : "http://localhost:3000/api/v1";

export async function getTags(
  workspaceId: IWorkspaceId,
  query?: ITagsQuery,
): Promise<ITagsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<ITagsResponse>(
    `${workspaceApiV1Path(workspaceId, "tags")}${queryString}`,
  );
}

export async function createTag(
  workspaceId: IWorkspaceId,
  input: ICreateTagInput,
): Promise<ITag> {
  return apiPost<ITag>(workspaceApiV1Path(workspaceId, "tags"), input);
}

export async function updateTag(
  workspaceId: IWorkspaceId,
  tagId: string,
  input: IUpdateTagInput,
): Promise<ITag> {
  return apiPatch<ITag>(workspaceApiV1Path(workspaceId, `tags/${tagId}`), input);
}

export async function deleteTag(
  workspaceId: IWorkspaceId,
  tagId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, `tags/${tagId}`),
  );
}

export async function bulkCreateTags(
  workspaceId: IWorkspaceId,
  input: IBulkCreateTagInput,
): Promise<IBulkCreateTagResponse> {
  return apiPost<IBulkCreateTagResponse>(
    workspaceApiV1Path(workspaceId, "tags/bulk"),
    input,
  );
}

export async function reorderTags(
  workspaceId: IWorkspaceId,
  input: IReorderTagsInput,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, "tags/reorder"),
    input,
  );
}

export async function uploadTagCsvFile(
  workspaceId: IWorkspaceId,
  file: File,
): Promise<ITagCsvUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_V1_BASE}${workspaceApiV1Path(workspaceId, "tags/csv-upload")}`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Upload failed");
  }

  return response.json();
}

export async function getTagCsvMapping(
  workspaceId: IWorkspaceId,
  columns: string[],
): Promise<ITagCsvFieldMapping> {
  return apiPost<ITagCsvFieldMapping>(
    workspaceApiV1Path(workspaceId, "tags/csv-mapping"),
    { columns },
  );
}

export async function validateTagCsvMapping(
  workspaceId: IWorkspaceId,
  mapping: ITagCsvFieldMapping,
): Promise<ITagCsvMappingValidation> {
  return apiPost<ITagCsvMappingValidation>(
    workspaceApiV1Path(workspaceId, "tags/csv-mapping/validate"),
    {
      mapping,
    },
  );
}

export async function parseTagCsvRows(
  workspaceId: IWorkspaceId,
  file: File,
  mapping: ITagCsvFieldMapping,
  page: number = 1,
  limit: number = 50,
): Promise<ITagCsvParseResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mapping", JSON.stringify(mapping));
  formData.append("page", page.toString());
  formData.append("limit", limit.toString());

  const response = await fetch(
    `${API_V1_BASE}${workspaceApiV1Path(workspaceId, "tags/csv-parse")}`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Parse failed");
  }

  return response.json();
}

export async function importTagCsv(
  workspaceId: IWorkspaceId,
  tags: ICreateTagInput[],
): Promise<ITagCsvImportResponse> {
  return apiPost<ITagCsvImportResponse>(
    workspaceApiV1Path(workspaceId, "tags/csv-import"),
    {
      tags,
    },
  );
}
