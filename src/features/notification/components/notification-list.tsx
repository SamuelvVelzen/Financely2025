import type { INotification } from "@/features/shared/validation/schemas";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { SkeletonText } from "@/features/ui/skeleton";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { NotificationItem } from "./notification-item";

type INotificationListProps = {
  notifications: INotification[];
  isLoading?: boolean;
};

export function NotificationList({ notifications, isLoading }: INotificationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border">
            <SkeletonText lines={3} />
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyPage
        icon={HiOutlineEnvelope}
        emptyText="No notifications yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
        />
      ))}
    </div>
  );
}
