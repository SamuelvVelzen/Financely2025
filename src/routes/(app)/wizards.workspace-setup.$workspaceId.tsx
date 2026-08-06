import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy full-page setup — workspace settings now open as a dialog after create. */
export const Route = createFileRoute(
  "/(app)/wizards/workspace-setup/$workspaceId",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$workspaceId",
      params: { workspaceId: params.workspaceId },
    });
  },
});
