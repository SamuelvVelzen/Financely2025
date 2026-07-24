import {
  createNotification,
  deleteNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "@/features/notification/api/client";
import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import { getOfflineOutboxUserId } from "@/features/shared/offline/offline-mutation-outbox";
import {
  buildOptimisticNotification,
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
  ICreateNotificationInput,
  INotification,
  INotificationsQuery,
  INotificationsResponse,
} from "@/features/shared/validation/schemas";
import { useQueryClient } from "@tanstack/react-query";

export function useNotifications(query?: INotificationsQuery) {
  const workspaceId = useActiveWorkspaceId();
  return useFinQuery<INotificationsResponse, Error>({
    queryKey: queryKeys.notifications(workspaceId, query),
    queryFn: () => getNotifications(workspaceId, query),
    staleTime: 30 * 1000,
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  const prefix = ["notifications", workspaceId] as const;
  return useFinMutation<INotification, Error, ICreateNotificationInput>({
    mutationFn: (input) => createNotification(workspaceId, input),
    invalidateQueries: [
      () => queryKeys.notifications(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    onMutate: async (input) => {
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      prependToPaginatedCaches(
        queryClient,
        [prefix],
        buildOptimisticNotification(input, getOfflineOutboxUserId() ?? "local"),
      );
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "Notification created successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  const prefix = ["notifications", workspaceId] as const;
  return useFinMutation<INotification, Error, string>({
    mutationFn: (notificationId) => markAsRead(workspaceId, notificationId),
    invalidateQueries: [
      () => queryKeys.notifications(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    onMutate: async (notificationId) => {
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      updateInPaginatedCaches<INotification>(
        queryClient,
        [prefix],
        notificationId,
        (item) => ({
          ...item,
          read: true,
          readAt: new Date().toISOString(),
        }),
      );
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "Notification marked as read",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  const prefix = ["notifications", workspaceId] as const;
  return useFinMutation<{ success: boolean }, Error, void>({
    mutationFn: () => markAllAsRead(workspaceId),
    invalidateQueries: [
      () => queryKeys.notifications(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    onMutate: async () => {
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      mapPaginatedQueries<INotificationsResponse, INotification>(
        queryClient,
        prefix,
        (items) =>
          items.map((item) => ({
            ...item,
            read: true,
            readAt: item.readAt ?? new Date().toISOString(),
          })),
      );
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "All notifications marked as read",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const workspaceId = useActiveWorkspaceId();
  const prefix = ["notifications", workspaceId] as const;
  return useFinMutation<{ success: boolean }, Error, string>({
    mutationFn: (notificationId) =>
      deleteNotification(workspaceId, notificationId),
    invalidateQueries: [
      () => queryKeys.notifications(workspaceId),
      () => queryKeys.unreadCount(workspaceId),
    ],
    onMutate: async (notificationId) => {
      const snapshot = await snapshotForPrefixes(queryClient, [prefix]);
      removeFromPaginatedCaches(queryClient, [prefix], notificationId);
      return { snapshot };
    },
    getOfflineQueuedToast: () => ({
      title: "Notification deleted successfully",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
