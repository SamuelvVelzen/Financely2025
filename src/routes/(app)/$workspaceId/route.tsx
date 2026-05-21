import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import { ActiveWorkspaceProvider } from "@/features/workspace/active-workspace-context";
import { parseWorkspaceIdParam } from "@/features/workspace/workspace-id";
import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/(app)/$workspaceId")({
  component: WorkspaceShellLayout,
});

function WorkspaceShellLayout() {
  const rawWorkspaceId = Route.useParams({
    select: (p) => p.workspaceId,
  });
  const workspaceId = parseWorkspaceIdParam(rawWorkspaceId);

  if (workspaceId === null) {
    throw notFound();
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        ACTIVE_WORKSPACE_STORAGE_KEY,
        String(workspaceId),
      );
    }
  }, [workspaceId]);

  return (
    <ActiveWorkspaceProvider workspaceId={workspaceId}>
      <Outlet />
    </ActiveWorkspaceProvider>
  );
}
