import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/notification/pages/notifications-page";
import { notificationFilterQuerySchema } from "@/features/notification/utils/notification-filter-query-schema";

export const Route = createFileRoute("/(app)/$workspaceId/notifications")({
  component: NotificationsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return notificationFilterQuerySchema.parse(search);
  },
  head: () => ({
    meta: [
      {
        title: "Notifications | Financely",
      },
    ],
  }),
});
