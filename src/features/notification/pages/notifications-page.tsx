import { NotificationList } from "@/features/notification/components/notification-list";
import {
  useMarkAllAsRead,
  useNotifications,
} from "@/features/notification/hooks/useNotifications";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { QueryErrorState } from "@/features/ui/container/query-error-state";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { useState } from "react";

export function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<
    "INFO" | "SUCCESS" | "WARNING" | "ERROR" | undefined
  >(undefined);
  const toast = useToast();
  const markAllAsRead = useMarkAllAsRead();

  const { data, isLoading, error, refetch } = useNotifications({
    read: filter === "unread" ? false : undefined,
    type: typeFilter,
    page: 1,
    limit: 50,
  });

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllAsRead.mutateAsync();
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success("All notifications marked as read");
      }
    } catch (_error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  return (
    <>
      <Container>
        <div className="flex items-center justify-between">
          <div>
            <Title>Notifications</Title>
            <p className="text-text-muted">View and manage your notifications.</p>
          </div>
          {data && data.data.length > 0 && (
            <Button
              size="sm"
              clicked={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              loading={{
                isLoading: markAllAsRead.isPending,
                text: "Marking all notifications as read",
              }}
              buttonContent="Mark All as Read"
            />
          )}
        </div>
      </Container>

      <Container>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={filter === "all" ? "primary" : "default"}
            size="sm"
            clicked={() => setFilter("all")}
            buttonContent="All"
          />
          <Button
            variant={filter === "unread" ? "primary" : "default"}
            size="sm"
            clicked={() => setFilter("unread")}
            buttonContent="Unread"
          />
          <Button
            variant={typeFilter === undefined ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter(undefined)}
            buttonContent="All Types"
          />
          <Button
            variant={typeFilter === "INFO" ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter("INFO")}
            buttonContent="Info"
          />
          <Button
            variant={typeFilter === "SUCCESS" ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter("SUCCESS")}
            buttonContent="Success"
          />
          <Button
            variant={typeFilter === "WARNING" ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter("WARNING")}
            buttonContent="Warning"
          />
          <Button
            variant={typeFilter === "ERROR" ? "primary" : "default"}
            size="sm"
            clicked={() => setTypeFilter("ERROR")}
            buttonContent="Error"
          />
        </div>

        {error && !isLoading ? (
          <QueryErrorState
            title="Unable to load notifications"
            notification={error.notification}
            onRetry={() => void refetch()}
          />
        ) : (
          <NotificationList
            notifications={data?.data || []}
            isLoading={isLoading}
          />
        )}
      </Container>
    </>
  );
}
