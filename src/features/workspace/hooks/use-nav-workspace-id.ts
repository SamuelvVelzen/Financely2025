import { useMe } from "@/features/users/hooks/useUser";
import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import {
  parseWorkspaceIdParam,
  type IWorkspaceId,
} from "@/features/workspace/workspace-id";
import { useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { resolveNavWorkspaceId } from "@/features/workspace/utils/resolve-nav-workspace-id";

/**
 * Resolves the workspace id for navigation and API calls outside the
 * explicit `/:workspaceId` route context (e.g. sidebar on /account).
 * Order: owned URL segment, then localStorage, then the user's first workspace.
 */
export function useNavWorkspaceId(): IWorkspaceId | null {
  const { data: me } = useMe();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return useMemo(() => {
    const workspaces = me?.workspaces ?? [];
    const storedRaw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)
        : null;
    return resolveNavWorkspaceId(pathname, workspaces, storedRaw);
  }, [me?.workspaces, pathname]);
}
