import { createTag, deleteTag, getTags, updateTag } from "@/lib/api/endpoints";
import type {
  CreateTagInput,
  Tag,
  TagsQuery,
  TagsResponse,
  UpdateTagInput,
} from "@/lib/validation/schemas";
import { queryKeys } from "../keys";
import { useFinMutation, useFinQuery } from "./core";

/**
 * Query tags list
 * - staleTime: 1-2 minutes (medium, keeps UI snappy)
 * - Supports filtering (q) and sorting
 */
export function useTags(query?: TagsQuery) {
  return useFinQuery<TagsResponse, Error>({
    queryKey: queryKeys.tags(query),
    queryFn: () => getTags(query),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Create tag mutation
 * - Invalidates tags query on success
 */
export function useCreateTag() {
  return useFinMutation<Tag, Error, CreateTagInput>({
    mutationFn: createTag,
    invalidateQueries: [queryKeys.tags],
  });
}

/**
 * Update tag mutation
 * - Invalidates tags query on success
 */
export function useUpdateTag() {
  return useFinMutation<Tag, Error, { tagId: string; input: UpdateTagInput }>({
    mutationFn: ({ tagId, input }) => updateTag(tagId, input),
    invalidateQueries: [queryKeys.tags],
  });
}

/**
 * Delete tag mutation
 * - Invalidates tags query on success
 */
export function useDeleteTag() {
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteTag,
    invalidateQueries: [queryKeys.tags, queryKeys.transactions],
  });
}
