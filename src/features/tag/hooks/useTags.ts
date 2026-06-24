import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
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
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import { useQueryClient } from "@tanstack/react-query";

function requireWorkspaceId(id: number | null): number {
  if (id == null) {
    throw new Error("Workspace is required");
  }
  return id;
}

export function useTags(query?: ITagsQuery) {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<ITagsResponse, Error>({
    queryKey: enabled
      ? queryKeys.tags(workspaceId, query)
      : (["tags", "disabled"] as const),
    queryFn: () => getTags(requireWorkspaceId(workspaceId), query),
    staleTime: 1 * 60 * 1000,
    enabled,
  });
}

export function useCreateTag() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ITag, Error, ICreateTagInput>({
    mutationFn: (input) =>
      createTag(requireWorkspaceId(workspaceId), input),
    invalidateQueries: [
      () => queryKeys.tags(workspaceId!),
      () => queryKeys.tagRules(workspaceId!),
    ],
    getOfflineQueuedToast: (input) => ({
      title: `Tag "${input.name}" created successfully`,
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useUpdateTag() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<ITag, Error, { tagId: string; input: IUpdateTagInput }>(
    {
      mutationFn: ({ tagId, input }) =>
        updateTag(requireWorkspaceId(workspaceId), tagId, input),
      invalidateQueries: [() => queryKeys.tags(workspaceId!)],
      getOfflineQueuedToast: (vars) => ({
        title: `Tag "${vars.input.name}" updated successfully`,
        message: OFFLINE_MUTATION_DEFAULT_DETAIL,
      }),
    },
  );
}

export function useDeleteTag() {
  const workspaceId = useNavWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (tagId) =>
      deleteTag(requireWorkspaceId(workspaceId), tagId),
    invalidateQueries: [
      () => queryKeys.tags(workspaceId!),
      () => queryKeys.transactions(workspaceId!),
    ],
    getOfflineQueuedToast: () => ({
      title: "Tag deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useReorderTags() {
  const workspaceId = useNavWorkspaceId();
  const queryClient = useQueryClient();
  const wid = workspaceId;

  return useFinMutation<
    { success: boolean },
    Error,
    IReorderTagsInput,
    {
      previousEntries: Array<[readonly unknown[], ITagsResponse | undefined]>;
    }
  >({
    mutationFn: (input) => reorderTags(requireWorkspaceId(wid), input),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["tags", wid],
      });

      const entries = queryClient.getQueriesData<ITagsResponse>({
        queryKey: ["tags", wid],
      });
      const previousEntries: Array<
        [readonly unknown[], ITagsResponse | undefined]
      > = entries.map(([key, data]) => [key, data]);

      const baseData = entries[0]?.[1];
      if (baseData) {
        const tagMap = new Map(baseData.data.map((tag) => [tag.id, tag]));
        const reorderedTags: ITag[] = [];

        variables.tagIds.forEach((tagId) => {
          const tag = tagMap.get(tagId);
          if (tag) {
            reorderedTags.push(tag);
          }
        });

        baseData.data.forEach((tag) => {
          if (!variables.tagIds.includes(tag.id)) {
            reorderedTags.push(tag);
          }
        });

        for (const [key] of entries) {
          queryClient.setQueryData<ITagsResponse>(key as readonly unknown[], {
            data: reorderedTags,
          });
        }
      }

      return { previousEntries };
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.previousEntries ?? []) {
        if (data !== undefined) {
          queryClient.setQueryData(key as readonly unknown[], data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["tags", wid],
      });
    },
    getOfflineQueuedToast: () => ({
      title: "Tag order saved",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
