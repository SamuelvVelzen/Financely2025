import { ACTIVE_WORKSPACE_STORAGE_KEY } from "@/features/workspace/constants";
import { parseWorkspaceIdParam } from "@/features/workspace/workspace-id";
import { useMe } from "@/features/users/hooks/useUser";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/(app)/")({
  component: AppHomeRedirect,
});

function AppHomeRedirect() {
  const navigate = useNavigate();
  const { data: me, isPending } = useMe();

  useEffect(() => {
    if (isPending || !me?.workspaces?.length) return;
    const workspaces = me.workspaces;
    const storedRaw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY)
        : null;
    const storedId = parseWorkspaceIdParam(storedRaw);
    const workspaceId =
      storedId !== null && workspaces.some((w) => w.id === storedId)
        ? storedId
        : workspaces[0]!.id;
    void navigate({
      to: "/$workspaceId",
      params: { workspaceId: String(workspaceId) },
      replace: true,
    });
  }, [isPending, me, navigate]);

  return (
    <div className="flex h-full items-center justify-center text-text-muted">
      Loading…
    </div>
  );
}
