import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  buildQueryString,
} from "@/features/shared/api/client";
import type {
  ICreateNotificationInput,
  INotificationsQuery,
  INotificationsResponse,
  INotification,
  IUnreadCountResponse,
} from "@/features/shared/validation/schemas";
import { workspaceApiV1Path } from "@/features/workspace/workspace-api-path";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export async function getNotifications(
  workspaceId: IWorkspaceId,
  query?: INotificationsQuery,
): Promise<INotificationsResponse> {
  const queryString = query ? buildQueryString(query) : "";
  return apiGet<INotificationsResponse>(
    `${workspaceApiV1Path(workspaceId, "notifications")}${queryString}`,
  );
}

export async function getNotification(
  workspaceId: IWorkspaceId,
  notificationId: string,
): Promise<INotification> {
  return apiGet<INotification>(
    workspaceApiV1Path(workspaceId, `notifications/${notificationId}`),
  );
}

export async function createNotification(
  workspaceId: IWorkspaceId,
  input: ICreateNotificationInput,
): Promise<INotification> {
  return apiPost<INotification>(
    workspaceApiV1Path(workspaceId, "notifications"),
    input,
  );
}

export async function markAsRead(
  workspaceId: IWorkspaceId,
  notificationId: string,
): Promise<INotification> {
  return apiPatch<INotification>(
    workspaceApiV1Path(workspaceId, `notifications/${notificationId}`),
    { read: true },
  );
}

export async function markAllAsRead(
  workspaceId: IWorkspaceId,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, "notifications/read-all"),
    {},
  );
}

export async function deleteNotification(
  workspaceId: IWorkspaceId,
  notificationId: string,
): Promise<{ success: boolean }> {
  return apiDelete<{ success: boolean }>(
    workspaceApiV1Path(workspaceId, `notifications/${notificationId}`),
  );
}

export async function getUnreadCount(
  workspaceId: IWorkspaceId,
): Promise<IUnreadCountResponse> {
  return apiGet<IUnreadCountResponse>(
    workspaceApiV1Path(workspaceId, "notifications/count"),
  );
}
