import { NotificationDevTriggers } from "@/features/notification/components/notification-dev-triggers";
import { NotificationList } from "@/features/notification/components/notification-list";
import { NotificationOverviewHeader } from "@/features/notification/components/notification-overview-header";
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
import { useScrollPosition } from "@/features/shared/hooks/use-scroll-position";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { INotificationType } from "@/features/shared/validation/enums";
import { Container } from "@/features/ui/container/container";
import { QueryErrorState } from "@/features/ui/container/query-error-state";
import { useToast } from "@/features/ui/toast";
import { matchesSearchQuery } from "@/features/util/matches-search-query";
import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";

type INotificationOverviewProps = {
  initialState?: Partial<INotificationFilterState>;
};

function emptyTextForFilters(
  status: INotificationStatusFilter,
  type: INotificationType | undefined,
  searchQuery: string,
): string {
  if (searchQuery.trim()) {
    return "No notifications match your search.";
  }
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

function getNotificationFilterCount(state: INotificationFilterState): number {
  let count = 0;
  if (state.searchQuery.trim()) {
    count += 1;
  }
  if (state.status !== "all") {
    count += 1;
  }
  if (state.type !== undefined) {
    count += 1;
  }
  return count;
}

export function NotificationOverview({
  initialState,
}: INotificationOverviewProps) {
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId();
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);
  const toast = useToast();
  const markAllAsRead = useMarkAllAsRead();
  const expandedHeaderRef = useRef<HTMLDivElement>(null);
  const [isSticky, setExpandedHeaderElement] = useScrollPosition();

  const {
    filterState,
    setStatus,
    setType,
    setSearchQuery,
    hasActiveFilters,
  } = useNotificationFilters({
    initialState,
  });
  const debouncedSearchQuery = useDebouncedValue(filterState.searchQuery, 300);
  const filterCount = getNotificationFilterCount({
    ...filterState,
    searchQuery: debouncedSearchQuery,
  });

  useEffect(() => {
    if (expandedHeaderRef.current) {
      setExpandedHeaderElement(expandedHeaderRef.current);
    }
  }, [setExpandedHeaderElement]);

  // Sync filter state changes to query params (same pattern as transactions)
  useEffect(() => {
    const queryParams = serializeFilterStateToQuery({
      status: filterState.status,
      type: filterState.type,
      searchQuery: debouncedSearchQuery,
    });
    navigate({
      to: "/$workspaceId/notifications",
      params: { workspaceId: workspaceRouteParam },
      search: queryParams as INotificationFilterQueryParams,
      replace: true,
    });
  }, [
    filterState.status,
    filterState.type,
    debouncedSearchQuery,
    navigate,
    workspaceId,
    workspaceRouteParam,
  ]);

  const apiQuery = filterStateToApiQuery(filterState);
  const { data, isLoading, error, refetch } = useNotifications({
    ...apiQuery,
    page: 1,
    limit: 50,
  });

  const filteredNotifications = useMemo(() => {
    const notifications = data?.data ?? [];
    return notifications.filter((notification) =>
      matchesSearchQuery(
        debouncedSearchQuery,
        notification.title,
        notification.content,
      ),
    );
  }, [data?.data, debouncedSearchQuery]);

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

  const handleStickyFiltersClick = () => {
    expandedHeaderRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showMarkAllAsRead =
    filterState.status !== "read" &&
    (data?.data.some((item) => !item.read) ?? false);

  return (
    <>
      <div ref={expandedHeaderRef} className="h-0" />

      <NotificationOverviewHeader
        searchQuery={filterState.searchQuery}
        onSearchChange={setSearchQuery}
        status={filterState.status}
        type={filterState.type}
        onStatusChange={setStatus}
        onTypeChange={setType}
        isSticky={isSticky}
        hasActiveFilters={hasActiveFilters}
        filterCount={filterCount}
        onFiltersClick={handleStickyFiltersClick}
        showMarkAllAsRead={showMarkAllAsRead}
        isMarkingAllAsRead={markAllAsRead.isPending}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      <NotificationDevTriggers />

      <Container>
        {error && !isLoading ? (
          <QueryErrorState
            title="Unable to load notifications"
            message={error.message}
            onRetry={() => void refetch()}
          />
        ) : (
          <NotificationList
            notifications={filteredNotifications}
            isLoading={isLoading}
            emptyText={emptyTextForFilters(
              filterState.status,
              filterState.type,
              debouncedSearchQuery,
            )}
          />
        )}
      </Container>
    </>
  );
}
