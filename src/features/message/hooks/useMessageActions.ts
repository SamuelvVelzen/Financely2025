import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/features/shared/api/client";
import type { IMessageAction } from "@/features/shared/validation/schemas";
import { useNavigate } from "@tanstack/react-router";
import { useMarkAsRead } from "./useMessages";

/**
 * Hook for handling message actions
 * Supports navigate, dismiss, api, and custom action types
 */
export function useMessageActions() {
  const navigate = useNavigate();
  const markAsRead = useMarkAsRead();

  const handleAction = async (
    action: IMessageAction,
    messageId?: string
  ): Promise<void> => {
    switch (action.type) {
      case "navigate":
        if (action.path) {
          navigate({ to: action.path });
        }
        break;

      case "dismiss":
        if (messageId) {
          await markAsRead.mutateAsync(messageId);
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
        // Custom handlers would need to be registered elsewhere
        // For now, just log
        console.warn("Custom action handler not implemented:", action.handler);
        break;

      default:
        console.warn("Unknown action type:", action.type);
    }
  };

  return { handleAction };
}
