import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ICreateTagInput,
  IReorderTagsInput,
  ITag,
  ITagsQuery,
  ITagsResponse,
  IUpdateTagInput,
} from "@/features/shared/validation/schemas";
import {
  createTag,
  deleteTag,
  getTags,
  reorderTags,
  updateTag,
} from "@/features/tag/api/client";

/**
 * Query tags list
 * - staleTime: 1-2 minutes (medium, keeps UI snappy)
 * - Supports filtering (q) and sorting
 */
export function useTags(query?: ITagsQuery) {
  return useFinQuery<ITagsResponse, Error>({
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
  return useFinMutation<ITag, Error, ICreateTagInput>({
    mutationFn: createTag,
    invalidateQueries: [queryKeys.tags],
  });
}

/**
 * Update tag mutation
 * - Invalidates tags query on success
 */
export function useUpdateTag() {
  return useFinMutation<ITag, Error, { tagId: string; input: IUpdateTagInput }>(
    {
      mutationFn: ({ tagId, input }) => updateTag(tagId, input),
      invalidateQueries: [queryKeys.tags],
    }
  );
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

/**
 * Reorder tags mutation
 * - Invalidates tags query on success
 */
export function useReorderTags() {
  return useFinMutation<{ success: boolean }, Error, IReorderTagsInput>({
    mutationFn: reorderTags,
    invalidateQueries: [queryKeys.tags],
  });
}
