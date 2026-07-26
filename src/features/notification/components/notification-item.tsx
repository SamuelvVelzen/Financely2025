import type { INotification } from "@/features/shared/validation/schemas";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { ListItem } from "@/features/ui/list/list-item";
import { useToast } from "@/features/ui/toast";
import { cn } from "@/features/util/cn";
import { useState } from "react";
import {
  useDeleteNotification,
  useMarkAsRead,
} from "../hooks/useNotifications";
import { formatNotificationRelativeTime } from "../utils/format-notification-relative-time";
import { NOTIFICATION_TYPE_META } from "../utils/notification-type-meta";
import { NotificationActions } from "./notification-actions";
import { NotificationItemActions } from "./notification-item-actions";

type INotificationItemProps = {
  notification: INotification;
};

export function NotificationItem({ notification }: INotificationItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteNotification = useDeleteNotification();
  const markAsRead = useMarkAsRead();
  const toast = useToast();
  const typeMeta = NOTIFICATION_TYPE_META[notification.type];
  const TypeIcon = typeMeta.icon;
  const isUnread = !notification.read;

  const handleMarkAsRead = () => {
    if (!isUnread || markAsRead.isPending) {
      return;
    }
    // Silent — the unread styling clearing is the feedback (no toast spam).
    markAsRead.mutate(notification.id, {
      onError: () => {
        toast.error("Failed to mark notification as read");
      },
    });
  };

  const handleDeleteConfirm = () => {
    deleteNotification.mutate(notification.id, {
      onSuccess: (data) => {
        setIsDeleteDialogOpen(false);
        if (!isOfflineMutationPlaceholder(data)) {
          toast.success("Notification deleted successfully");
        }
      },
      onError: () => {
        toast.error("Failed to delete notification");
      },
    });
  };

  return (
    <>
      <ListItem
        className={cn("items-start py-3", isUnread && "bg-primary/5")}
        clicked={isUnread ? handleMarkAsRead : undefined}
        aria-label={
          isUnread ? "Mark notification as read" : undefined
        }>
        <div className="flex w-full min-w-0 gap-3">
          <TypeIcon
            className={cn("mt-0.5 size-5 shrink-0", typeMeta.iconClassName)}
            aria-hidden
          />
          <span className="sr-only">{typeMeta.label}</span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h3
                    className={cn(
                      "truncate text-text",
                      isUnread ? "font-semibold" : "font-medium",
                    )}>
                    {notification.title}
                  </h3>
                  {isUnread ? (
                    <span
                      className="size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-text-muted">
                  {notification.content}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <time
                  dateTime={notification.createdAt}
                  className="whitespace-nowrap text-xs text-text-muted">
                  {formatNotificationRelativeTime(notification.createdAt)}
                </time>
                <NotificationItemActions
                  onDelete={() => setIsDeleteDialogOpen(true)}
                />
              </div>
            </div>

            <NotificationActions
              actions={notification.actions}
              notificationId={notification.id}
            />
          </div>
        </div>
      </ListItem>

      <DeleteDialog
        title="Delete Notification"
        content={
          <p className="text-text-muted">
            Are you sure you want to delete this notification? This action
            cannot be undone.
          </p>
        }
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        footerButtons={[
          {
            clicked: () => setIsDeleteDialogOpen(false),
            buttonContent: "Cancel",
          },
          {
            clicked: handleDeleteConfirm,
            variant: "danger",
            loading: {
              isLoading: deleteNotification.isPending,
              text: "Deleting notification",
            },
            buttonContent: "Delete",
            disabled: deleteNotification.isPending,
          },
        ]}
      />
    </>
  );
}
