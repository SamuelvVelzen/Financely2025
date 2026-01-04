import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/")({
  component: DashboardPage,
  head: () => ({
    meta: [
      {
        title: "Dashboard | Financely",
      },
    ],
  }),
});

export function DashboardPage() {
  return <DashboardOverview />;
}
