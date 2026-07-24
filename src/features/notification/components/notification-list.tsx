import type { INotification } from "@/features/shared/validation/schemas";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { SkeletonText } from "@/features/ui/skeleton";
import { HiOutlineBell } from "react-icons/hi2";
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
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-3 rounded-2xl border border-border p-4">
            <div className="size-9 shrink-0 rounded-full bg-surface-hover animate-pulse" />
            <div className="flex-1">
              <SkeletonText lines={3} />
            </div>
          </div>
        ))}
      </div>
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

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
}
