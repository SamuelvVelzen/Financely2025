import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import { parseWorkspaceIdParam } from "@/features/workspace/workspace-id";
import { useUserSettings } from "@/features/users/hooks/useUserSettings";
import { useMe } from "@/features/users/hooks/useUser";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  consumeUserWorkspaceNavigation,
  markHomeRedirectStarted,
} from "@/features/workspace/utils/workspace-navigation-guard";

export const Route = createFileRoute("/(app)/")({
  component: AppHomeRedirect,
});

function AppHomeRedirect() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: me, isPending: mePending } = useMe();
  const { data: settings, isPending: settingsPending } = useUserSettings();

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }
    if (consumeUserWorkspaceNavigation()) {
      return;
    }
    if (mePending || settingsPending || !me?.workspaces?.length) return;
    if (!markHomeRedirectStarted()) return;
    const workspaces = me.workspaces;
    const workspaceIds = workspaces.map((w) => w.id);

    const fromSettings =
      settings?.defaultWorkspaceId != null &&
      workspaceIds.includes(settings.defaultWorkspaceId)
        ? settings.defaultWorkspaceId
        : null;

    const storedRaw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)
        : null;
    const storedId = parseWorkspaceIdParam(storedRaw);
    const fromStorage =
      storedId !== null && workspaceIds.includes(storedId) ? storedId : null;

    const workspaceId = fromSettings ?? fromStorage ?? workspaces[0]!.id;
    void navigate({
      to: "/$workspaceId",
      params: { workspaceId: String(workspaceId) },
      replace: true,
    });
  }, [pathname, mePending, settingsPending, me, settings, navigate]);

  return (
    <div className="flex h-full items-center justify-center text-text-muted">
      Loading…
    </div>
  );
}
