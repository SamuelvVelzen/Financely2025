import type { INotification } from "@/features/shared/validation/schemas";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { IconButton } from "@/features/ui/button/icon-button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { useToast } from "@/features/ui/toast";
import { cn } from "@/features/util/cn";
import { useState } from "react";
import { HiTrash } from "react-icons/hi2";
import { useDeleteNotification } from "../hooks/useNotifications";
import { formatNotificationRelativeTime } from "../utils/format-notification-relative-time";
import { NOTIFICATION_TYPE_META } from "../utils/notification-type-meta";
import { NotificationActions } from "./notification-actions";

type INotificationItemProps = {
  notification: INotification;
};

export function NotificationItem({ notification }: INotificationItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteNotification = useDeleteNotification();
  const toast = useToast();
  const typeMeta = NOTIFICATION_TYPE_META[notification.type];
  const TypeIcon = typeMeta.icon;

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
      <article
        className={cn(
          "relative flex gap-3 rounded-2xl border border-border bg-surface p-4",
          !notification.read && "bg-surface-hover/40",
        )}>
        {!notification.read ? (
          <span
            aria-hidden
            className={cn(
              "absolute left-0 top-4 bottom-4 w-1 rounded-full",
              typeMeta.accentClassName,
            )}
          />
        ) : null}

        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-hover",
            typeMeta.iconClassName,
          )}>
          <TypeIcon className="size-5" aria-hidden />
          <span className="sr-only">{typeMeta.label}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3
                  className={cn(
                    "text-base text-text",
                    !notification.read ? "font-semibold" : "font-medium",
                  )}>
                  {notification.title}
                </h3>
                {!notification.read ? (
                  <span className="size-1.5 rounded-full bg-info shrink-0" aria-label="Unread" />
                ) : null}
              </div>
              <p className="mt-1 text-sm text-text-muted whitespace-pre-wrap">
                {notification.content}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <time
                dateTime={notification.createdAt}
                className="text-xs text-text-muted whitespace-nowrap">
                {formatNotificationRelativeTime(notification.createdAt)}
              </time>
              <IconButton
                variant="danger"
                size="sm"
                clicked={() => setIsDeleteDialogOpen(true)}
                ariaLabel="Delete notification">
                <HiTrash className="size-4" />
              </IconButton>
            </div>
          </div>

          <NotificationActions
            actions={notification.actions}
            notificationId={notification.id}
          />
        </div>
      </article>

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
