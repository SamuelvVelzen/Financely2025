import { NotificationOverview } from "@/features/notification/components/notification-overview";
import { deserializeFilterStateFromQuery } from "@/features/notification/utils/notification-filter-model";
import { useSearch } from "@tanstack/react-router";

export function NotificationsPage() {
  const search = useSearch({ from: "/(app)/$workspaceId/notifications" });
  const initialState = deserializeFilterStateFromQuery(search);
  return <NotificationOverview initialState={initialState} />;
}
