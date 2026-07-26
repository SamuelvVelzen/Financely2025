import type { INotification } from "@/features/shared/validation/schemas";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { SkeletonText } from "@/features/ui/skeleton";
import { cn } from "@/features/util/cn";
import { HiOutlineBell } from "react-icons/hi2";
import { groupNotificationsByDate } from "../utils/group-notifications-by-date";
import { NotificationItem } from "./notification-item";

type INotificationListProps = {
  notifications: INotification[];
  isLoading?: boolean;
  emptyText?: string;
};

export function NotificationList({
  notifications,
  isLoading,
  emptyText = "No notifications yet.",
}: INotificationListProps) {
  if (isLoading) {
    return (
      <List>
        {[1, 2, 3].map((i) => (
          <ListItem
            key={i}
            className="items-start py-3">
            <div className="flex w-full min-w-0 gap-3">
              <div className="mt-0.5 size-5 shrink-0 animate-pulse rounded bg-surface-hover" />
              <div className="min-w-0 flex-1">
                <SkeletonText lines={2} />
              </div>
            </div>
          </ListItem>
        ))}
      </List>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyPage
        icon={HiOutlineBell}
        emptyText={emptyText}
      />
    );
  }

  const dateGroups = groupNotificationsByDate(notifications);

  return (
    <div className="overflow-hidden">
      {dateGroups.map((group, groupIndex) => (
        <div
          key={group.date}
          className={cn("mb-4", groupIndex > 0 && "mt-6")}>
          <div className="mb-2 px-4 py-2">
            <h3 className="text-sm font-semibold text-text-muted">
              {group.dateHeader}
            </h3>
          </div>

          <List
            data={group.notifications}
            getItemKey={(notification) => notification.id}>
            {(notification) => (
              <NotificationItem notification={notification} />
            )}
          </List>
        </div>
      ))}
    </div>
  );
}
