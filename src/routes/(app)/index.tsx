import type { IWorkspaceSummary } from "@/features/shared/validation/schemas";
import { useUserSettings } from "@/features/users/hooks/useUserSettings";
import { useMe } from "@/features/users/hooks/useUser";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { Loading } from "@/features/ui/loading";
import { AddOrEditWorkspaceDialog } from "@/features/workspace/components/add-or-edit-workspace-dialog";
import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import { parseWorkspaceIdParam } from "@/features/workspace/workspace-id";
import {
  consumeUserWorkspaceNavigation,
  markHomeRedirectStarted,
} from "@/features/workspace/utils/workspace-navigation-guard";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HiOutlineRectangleStack } from "react-icons/hi2";

export const Route = createFileRoute("/(app)/")({
  component: AppHomeRedirect,
});

function AppHomeRedirect() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: me, isPending: mePending } = useMe();
  const { data: settings, isPending: settingsPending } = useUserSettings();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const isLoading = mePending || settingsPending;
  const hasNoWorkspaces = !isLoading && me != null && me.workspaces.length === 0;

  const handleWorkspaceCreated = (created?: IWorkspaceSummary) => {
    if (created) {
      void navigate({
        to: "/$workspaceId",
        params: { workspaceId: String(created.id) },
        replace: true,
      });
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loading text="Loading" />
      </div>
    );
  }

  if (hasNoWorkspaces) {
    return (
      <>
        <div className="flex h-full items-center justify-center px-4">
          <EmptyPage
            icon={HiOutlineRectangleStack}
            emptyText="Create a workspace to start managing your finances."
            button={{
              buttonContent: "Create Workspace",
              clicked: () => setIsCreateDialogOpen(true),
            }}
          />
        </div>
        <AddOrEditWorkspaceDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={handleWorkspaceCreated}
        />
      </>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <Loading text="Loading" />
    </div>
  );
}
