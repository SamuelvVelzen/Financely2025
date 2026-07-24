import { NotificationFilters } from "@/features/notification/components/notification-filters";
import { NotificationList } from "@/features/notification/components/notification-list";
import { useNotificationFilters } from "@/features/notification/hooks/useNotificationFilters";
import {
  useMarkAllAsRead,
  useNotifications,
} from "@/features/notification/hooks/useNotifications";
import {
  filterStateToApiQuery,
  serializeFilterStateToQuery,
  type INotificationFilterState,
} from "@/features/notification/utils/notification-filter-model";
import type {
  INotificationFilterQueryParams,
  INotificationStatusFilter,
} from "@/features/notification/utils/notification-filter-query-schema";
import { NOTIFICATION_TYPE_META } from "@/features/notification/utils/notification-type-meta";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { INotificationType } from "@/features/shared/validation/enums";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { QueryErrorState } from "@/features/ui/container/query-error-state";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HiOutlineBell } from "react-icons/hi2";

type INotificationOverviewProps = {
  initialState?: Partial<INotificationFilterState>;
};

function emptyTextForFilters(
  status: INotificationStatusFilter,
  type: INotificationType | undefined,
): string {
  if (status === "unread") {
    return "No unread notifications.";
  }
  if (status === "read") {
    return "No read notifications.";
  }
  if (type) {
    return `No ${NOTIFICATION_TYPE_META[type].label.toLowerCase()} notifications.`;
  }
  return "No notifications yet.";
}

export function NotificationOverview({
  initialState,
}: INotificationOverviewProps) {
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId();
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);
  const toast = useToast();
  const markAllAsRead = useMarkAllAsRead();

  const { filterState, setStatus, setType } = useNotificationFilters({
    initialState,
  });

  // Sync filter state changes to query params (same pattern as transactions)
  useEffect(() => {
    const queryParams = serializeFilterStateToQuery(filterState);
    navigate({
      to: "/$workspaceId/notifications",
      params: { workspaceId: workspaceRouteParam },
      search: queryParams as INotificationFilterQueryParams,
      replace: true,
    });
  }, [filterState, navigate, workspaceId, workspaceRouteParam]);

  const apiQuery = filterStateToApiQuery(filterState);
  const { data, isLoading, error, refetch } = useNotifications({
    ...apiQuery,
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

  const showMarkAllAsRead =
    filterState.status !== "read" &&
    (data?.data.some((item) => !item.read) ?? false);

  return (
    <>
      <Container>

        <Title className="flex items-center gap-2">
          <HiOutlineBell className="size-6 shrink-0" />
          Notifications
        </Title>

      </Container>

      <Container>
        <div className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2 md:gap-3">
          <NotificationFilters
            className="mb-0"
            status={filterState.status}
            type={filterState.type}
            onStatusChange={setStatus}
            onTypeChange={setType}
          />
          {showMarkAllAsRead ? (
            <Button
              size="sm"
              className="shrink-0"
              clicked={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
              loading={{
                isLoading: markAllAsRead.isPending,
                text: "Marking all notifications as read",
              }}
              buttonContent="Mark all as read"
            />
          ) : null}
        </div>

        {error && !isLoading ? (
          <QueryErrorState
            title="Unable to load notifications"
            message={error.message}
            onRetry={() => void refetch()}
          />
        ) : (
          <NotificationList
            notifications={data?.data || []}
            isLoading={isLoading}
            emptyText={emptyTextForFilters(
              filterState.status,
              filterState.type,
            )}
          />
        )}
      </Container>
    </>
  );
}

