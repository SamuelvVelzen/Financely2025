import { getUnreadCount } from "@/features/message/api/client";
import { useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import { useNavWorkspaceId } from "@/features/workspace/hooks/use-nav-workspace-id";
import type { IUnreadCountResponse } from "@/features/shared/validation/schemas";

/**
 * Unread count for the resolved nav workspace (sidebar, top nav on /account, etc.).
 */
export function useUnreadCount() {
  const workspaceId = useNavWorkspaceId();
  const enabled = workspaceId != null;
  return useFinQuery<IUnreadCountResponse, Error>({
    queryKey: enabled
      ? queryKeys.unreadCount(workspaceId)
      : (["unread-count", "disabled"] as const),
    queryFn: () => {
      if (workspaceId == null) {
        throw new Error("Unread count query ran without a workspace");
      }
      return getUnreadCount(workspaceId);
    },
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    enabled,
  });
}
