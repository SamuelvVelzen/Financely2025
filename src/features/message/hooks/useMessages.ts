import {
  createMessage,
  deleteMessage,
  getMessages,
  markAllAsRead,
  markAsRead,
} from "@/features/message/api/client";
import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import type {
  ICreateMessageInput,
  IMessage,
  IMessagesQuery,
  IMessagesResponse,
} from "@/features/shared/validation/schemas";

export function useMessages(query?: IMessagesQuery) {
  const workspaceId = useActiveWorkspaceId();
  return useFinQuery<IMessagesResponse, Error>({
    queryKey: queryKeys.messages(workspaceId, query),
    queryFn: () => getMessages(workspaceId, query),
    staleTime: 30 * 1000,
  });
}

export function useCreateMessage() {
  const workspaceId = useActiveWorkspaceId();
  return useFinMutation<IMessage, Error, ICreateMessageInput>({
    mutationFn: (input) => createMessage(workspaceId, input),
    invalidateQueries: [
      () => queryKeys.messages(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
  });
}

export function useMarkAsRead() {
  const workspaceId = useActiveWorkspaceId();
  return useFinMutation<IMessage, Error, string>({
    mutationFn: (messageId) => markAsRead(workspaceId, messageId),
    invalidateQueries: [
      () => queryKeys.messages(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
  });
}

export function useMarkAllAsRead() {
  const workspaceId = useActiveWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, void>({
    mutationFn: () => markAllAsRead(workspaceId),
    invalidateQueries: [
      () => queryKeys.messages(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    getOfflineQueuedToast: () => ({
      title: "All messages marked as read",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDeleteMessage() {
  const workspaceId = useActiveWorkspaceId();
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (messageId) => deleteMessage(workspaceId, messageId),
    invalidateQueries: [
      () => queryKeys.messages(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    getOfflineQueuedToast: () => ({
      title: "Message deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
