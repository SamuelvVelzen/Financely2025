import {
  createMessage,
  deleteMessage,
  getMessages,
  markAllAsRead,
  markAsRead,
} from "@/features/message/api/client";
import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import { getOfflineOutboxUserId } from "@/features/shared/offline/offline-mutation-outbox";
import {
  buildOptimisticMessage,
  mapPaginatedQueries,
  prependToPaginatedCaches,
  removeFromPaginatedCaches,
  snapshotForPrefixes,
  updateInPaginatedCaches,
} from "@/features/shared/offline/optimistic-cache";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import type {
  ICreateMessageInput,
  IMessage,
  IMessagesQuery,
  IMessagesResponse,
} from "@/features/shared/validation/schemas";
import { useQueryClient } from "@tanstack/react-query";

export function useMessages(query?: IMessagesQuery) {
  const workspaceId = useActiveWorkspaceId();
  return useFinQuery<IMessagesResponse, Error>({
    queryKey: queryKeys.messages(workspaceId, query),
    queryFn: () => getMessages(workspaceId, query),
    staleTime: 30 * 1000,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  const prefix = ["messages", workspaceId] as const;
  return useFinMutation<IMessage, Error, ICreateMessageInput>({
    mutationFn: (input) => createMessage(workspaceId, input),
    invalidateQueries: [
      () => queryKeys.messages(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    onMutate: async (input) => {
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      prependToPaginatedCaches(
        queryClient,
        [prefix],
        buildOptimisticMessage(input, getOfflineOutboxUserId() ?? "local"),
      );
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "Message created successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  const prefix = ["messages", workspaceId] as const;
  return useFinMutation<IMessage, Error, string>({
    mutationFn: (messageId) => markAsRead(workspaceId, messageId),
    invalidateQueries: [
      () => queryKeys.messages(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    onMutate: async (messageId) => {
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      updateInPaginatedCaches<IMessage>(
        queryClient,
        [prefix],
        messageId,
        (msg) => ({
          ...msg,
          read: true,
          readAt: new Date().toISOString(),
        }),
      );
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "Message marked as read",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  const prefix = ["messages", workspaceId] as const;
  return useFinMutation<{ success: boolean }, Error, void>({
    mutationFn: () => markAllAsRead(workspaceId),
    invalidateQueries: [
      () => queryKeys.messages(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    onMutate: async () => {
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      mapPaginatedQueries<IMessagesResponse, IMessage>(
        queryClient,
        prefix,
        (items) =>
          items.map((msg) => ({
            ...msg,
            read: true,
            readAt: msg.readAt ?? new Date().toISOString(),
          })),
      );
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "All messages marked as read",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  const prefix = ["messages", workspaceId] as const;
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (messageId) => deleteMessage(workspaceId, messageId),
    invalidateQueries: [
      () => queryKeys.messages(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    onMutate: async (messageId) => {
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      removeFromPaginatedCaches(queryClient, [prefix], messageId);
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "Message deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
