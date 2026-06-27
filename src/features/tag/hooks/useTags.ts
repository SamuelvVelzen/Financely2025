import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import {
  buildOptimisticTag,
  prependToDataListCaches,
  removeFromDataListCaches,
  snapshotForPrefixes,
  updateInDataListCaches,
} from "@/features/shared/offline/optimistic-cache";
import { setPendingClientEntityId } from "@/features/shared/offline/optimistic-entity-context";
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
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<ITag, Error, ICreateTagInput>({
    mutationFn: (input) =>
      createTag(requireWorkspaceId(workspaceId), input),
    invalidateQueries: [
      () => queryKeys.tags(wid),
      () => queryKeys.tagRules(wid),
    ],
    onMutate: async (input) => {
      const tempId = crypto.randomUUID();
      setPendingClientEntityId(tempId);
      const prefix = ["tags", wid] as const;
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      const optimistic = buildOptimisticTag(input, tempId);
      prependToDataListCaches(queryClient, [prefix], optimistic, {
        seedKeysIfEmpty: [
          ["tags", wid],
          ["tags", wid, { sort: "name:asc" }],
          ["tags", wid, { q: undefined, sort: "name:asc" }],
        ],
      });
      return { snapshot };
    },
    getOfflineQueuedToast: (input) => ({
      title: `Tag "${input.name}" created successfully`,
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<ITag, Error, { tagId: string; input: IUpdateTagInput }>(
    {
      mutationFn: ({ tagId, input }) =>
        updateTag(requireWorkspaceId(workspaceId), tagId, input),
      invalidateQueries: [() => queryKeys.tags(wid)],
      onMutate: async ({ tagId, input }) => {
        const prefix = ["tags", wid] as const;
        const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
        updateInDataListCaches<ITag>(queryClient, [prefix], tagId, (tag) => ({
          ...tag,
          ...input,
          emoticon:
            input.emoticon !== undefined ? input.emoticon : tag.emoticon,
          updatedAt: new Date().toISOString(),
        }));
        return { snapshot };
      },
      getOfflineQueuedToast: (vars) => ({
        title: `Tag "${vars.input.name ?? "Tag"}" updated successfully`,
        message: OFFLINE_MUTATION_DEFAULT_DETAIL,
      }),
    },
  );
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  const workspaceId = useNavWorkspaceId();
  const wid = workspaceId!;
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (tagId) =>
      deleteTag(requireWorkspaceId(workspaceId), tagId),
    invalidateQueries: [
      () => queryKeys.tags(wid),
      () => queryKeys.transactions(wid),
    ],
    onMutate: async (tagId) => {
      const prefix = ["tags", wid] as const;
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      removeFromDataListCaches(queryClient, [prefix], tagId);
      return { snapshot };
    },
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
