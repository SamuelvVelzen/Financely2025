import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/features/shared/api/client";
import type { INotificationAction } from "@/features/shared/validation/schemas";
import { useNavigate } from "@tanstack/react-router";
import { useMarkAsRead } from "./useNotifications";

/**
 * Hook for handling notification actions
 * Supports navigate, dismiss, api, and custom action types
 */
export function useNotificationActions() {
  const navigate = useNavigate();
  const markAsRead = useMarkAsRead();

  const handleAction = async (
    action: INotificationAction,
    notificationId?: string,
  ): Promise<void> => {
    switch (action.type) {
      case "navigate":
        if (notificationId) {
          await markAsRead.mutateAsync(notificationId);
        }
        if (action.path) {
          navigate({ to: action.path });
        }
        break;

      case "dismiss":
        // Dismiss = mark as read (keeps the notification). Delete removes it.
        if (notificationId) {
          await markAsRead.mutateAsync(notificationId);
        }
        break;

      case "api":
        if (action.endpoint) {
          const method = action.method || "GET";
          switch (method) {
            case "GET":
              await apiGet(action.endpoint);
              break;
            case "POST":
              await apiPost(action.endpoint, {});
              break;
            case "PATCH":
              await apiPatch(action.endpoint, {});
              break;
            case "DELETE":
              await apiDelete(action.endpoint);
              break;
          }
        }
        break;

      case "custom":
        console.warn("Custom action handler not implemented:", action.handler);
        break;

      default:
        console.warn("Unknown action type:", action.type);
    }
  };

  return { handleAction };
}
