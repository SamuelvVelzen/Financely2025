import { RouteErrorFallback } from "@/features/ui/container/route-error-fallback";
import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import { ActiveWorkspaceProvider } from "@/features/workspace/active-workspace-context";
import { parseWorkspaceIdParam } from "@/features/workspace/workspace-id";
import { useMe } from "@/features/users/hooks/useUser";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import {
  createFileRoute,
  notFound,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/(app)/$workspaceId")({
  beforeLoad: ({ params }) => {
    const workspaceId = parseWorkspaceIdParam(params.workspaceId);
    if (workspaceId === null) {
      throw notFound();
    }
  },
  component: WorkspaceShellLayout,
  errorComponent: WorkspaceRouteError,
});

function WorkspaceShellLayout() {
  const { data: me, isPending } = useMe();
  const navigate = useNavigate();
  const rawWorkspaceId = Route.useParams({
    select: (p) => p.workspaceId,
  });
  const workspaceId = parseWorkspaceIdParam(rawWorkspaceId);

  if (workspaceId === null) {
    throw notFound();
  }

  const isOwned =
    me?.workspaces.some((workspace) => workspace.id === workspaceId) ?? false;

  useEffect(() => {
    if (isPending || !me) {
      return;
    }
    if (!isOwned) {
      void navigate({ to: "/", replace: true });
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        ACTIVE_WORKSPACE_STORAGE_KEY,
        String(workspaceId),
      );
    }
  }, [isPending, me, isOwned, navigate, workspaceId]);

  if (isPending || !me || !isOwned) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        Loading…
      </div>
    );
  }

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
