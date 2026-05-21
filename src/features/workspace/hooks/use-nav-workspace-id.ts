import { useMe } from "@/features/users/hooks/useUser";
import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import {
  parseWorkspaceIdParam,
  type IWorkspaceId,
} from "@/features/workspace/workspace-id";
import { useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";

/**
 * Resolves the workspace id for navigation and API calls outside the
 * explicit `/:workspaceId` route context (e.g. sidebar on /account).
 * Order: URL first segment if it matches a user workspace, then localStorage,
 * then the user's first workspace.
 */
export function useNavWorkspaceId(): IWorkspaceId | null {
  const { data: me } = useMe();
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  return useMemo(() => {
    const workspaces = me?.workspaces ?? [];
    if (workspaces.length === 0) {
      return null;
    }

    const firstSeg = pathname.split("/").filter(Boolean)[0] ?? "";
    const fromUrl = parseWorkspaceIdParam(firstSeg);
    if (
      fromUrl !== null &&
      workspaces.some((w) => w.id === fromUrl)
    ) {
      return fromUrl;
    }

    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY);
      const fromStorage = parseWorkspaceIdParam(stored);
      if (
        fromStorage !== null &&
        workspaces.some((w) => w.id === fromStorage)
      ) {
        return fromStorage;
      }
    }

    return workspaces[0]!.id;
  }, [me?.workspaces, pathname]);
}
