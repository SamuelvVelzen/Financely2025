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
import type {
  ICreateMessageInput,
  IMessage,
  IMessagesQuery,
  IMessagesResponse,
} from "@/features/shared/validation/schemas";

/**
 * Query messages list
 * - staleTime: 30 seconds (short, messages change frequently)
 * - Supports pagination, filtering by read status and type
 */
export function useMessages(query?: IMessagesQuery) {
  return useFinQuery<IMessagesResponse, Error>({
    queryKey: queryKeys.messages(query),
    queryFn: () => getMessages(query),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Create message mutation
 * - Invalidates messages query on success
 */
export function useCreateMessage() {
  return useFinMutation<IMessage, Error, ICreateMessageInput>({
    mutationFn: createMessage,
    invalidateQueries: [queryKeys.messages, queryKeys.unreadCount],
  });
}

/**
 * Mark message as read mutation
 * - Invalidates messages query and unread count on success
 */
export function useMarkAsRead() {
  return useFinMutation<IMessage, Error, string>({
    mutationFn: markAsRead,
    invalidateQueries: [queryKeys.messages, queryKeys.unreadCount],
  });
}

/**
 * Mark all messages as read mutation
 * - Invalidates messages query and unread count on success
 */
export function useMarkAllAsRead() {
  return useFinMutation<{ success: boolean }, Error, void>({
    mutationFn: markAllAsRead,
    invalidateQueries: [queryKeys.messages, queryKeys.unreadCount],
    getOfflineQueuedToast: () => ({
      title: "All messages marked as read",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Delete message mutation
 * - Invalidates messages query and unread count on success
 */
export function useDeleteMessage() {
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteMessage,
    invalidateQueries: [queryKeys.messages, queryKeys.unreadCount],
    getOfflineQueuedToast: () => ({
      title: "Message deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
