import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "./dashboard-page";

export const Route = createFileRoute("/(app)/$workspaceId/")({
  component: DashboardPage,
  head: () => ({
    meta: [
      {
        title: "Dashboard | Financely",
      },
    ],
  }),
});
