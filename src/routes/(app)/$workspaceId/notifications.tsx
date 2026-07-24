import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/notification/pages/notifications-page";

export const Route = createFileRoute("/(app)/$workspaceId/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      {
        title: "Notifications | Financely",
      },
    ],
  }),
});
