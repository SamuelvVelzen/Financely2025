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
import { useQueryClient } from "@tanstack/react-query";

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
 * - Optimistic update: immediately reorders tags in cache
 * - Invalidates tags query on success to sync with server
 * - Reverts on error
 */
export function useReorderTags() {
  const queryClient = useQueryClient();

  return useFinMutation<
    { success: boolean },
    Error,
    IReorderTagsInput,
    { previousTags: ITagsResponse | undefined }
  >({
    mutationFn: reorderTags,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.tags(),
      });

      // Snapshot previous value for rollback
      const previousTags = queryClient.getQueryData<ITagsResponse>(
        queryKeys.tags()
      );

      // Optimistically update the cache
      if (previousTags) {
        const tagMap = new Map(previousTags.data.map((tag) => [tag.id, tag]));
        const reorderedTags: ITag[] = [];

        // Reorder based on provided tagIds
        variables.tagIds.forEach((tagId) => {
          const tag = tagMap.get(tagId);
          if (tag) {
            reorderedTags.push(tag);
          }
        });

        // Add any tags not in the reorder list (shouldn't happen, but safety check)
        previousTags.data.forEach((tag) => {
          if (!variables.tagIds.includes(tag.id)) {
            reorderedTags.push(tag);
          }
        });

        queryClient.setQueryData<ITagsResponse>(queryKeys.tags(), {
          data: reorderedTags,
        });
      }

      return { previousTags };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData<ITagsResponse>(
          queryKeys.tags(),
          context.previousTags
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags(),
      });
    },
  });
}
