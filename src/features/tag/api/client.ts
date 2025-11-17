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
