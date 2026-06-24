import { parseWorkspaceIdParam } from "@/features/workspace/workspace-id";
import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  WorkspaceRouteError,
  WorkspaceShellLayout,
} from "@/features/workspace/pages/workspace-shell-layout";

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
