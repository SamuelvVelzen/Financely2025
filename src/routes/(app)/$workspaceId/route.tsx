import { RouteErrorFallback } from "@/features/ui/container/route-error-fallback";
import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import { ActiveWorkspaceProvider } from "@/features/workspace/active-workspace-context";
import { parseWorkspaceIdParam } from "@/features/workspace/workspace-id";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/(app)/$workspaceId")({
  component: WorkspaceShellLayout,
  errorComponent: WorkspaceRouteError,
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

function WorkspaceRouteError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <QueryErrorResetBoundary>
      {({ reset: resetQueries }) => (
        <RouteErrorFallback
          error={error}
          reset={() => {
            resetQueries();
            reset();
          }}
        />
      )}
    </QueryErrorResetBoundary>
  );
}
