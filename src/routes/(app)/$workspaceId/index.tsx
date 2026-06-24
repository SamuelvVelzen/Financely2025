import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";

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
