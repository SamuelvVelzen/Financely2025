import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/$workspaceId/smart-tagging")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$workspaceId/tags/smart-tagging",
      params,
    });
  },
});
