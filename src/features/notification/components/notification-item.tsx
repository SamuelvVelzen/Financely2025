import type { INotification } from "@/features/shared/validation/schemas";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { Badge } from "@/features/ui/badge/badge";
import { IconButton } from "@/features/ui/button/icon-button";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { useToast } from "@/features/ui/toast";
import { cn } from "@/features/util/cn";
import { useState } from "react";
import { HiTrash } from "react-icons/hi2";
import { useDeleteNotification } from "../hooks/useNotifications";
import { NotificationActions } from "./notification-actions";

type INotificationItemProps = {
  notification: INotification;
};

export function NotificationItem({ notification }: INotificationItemProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteNotification = useDeleteNotification();
  const toast = useToast();

  const typeStyles = {
    INFO: "border-l-4 border-info bg-info-bg/50",
    SUCCESS: "border-l-4 border-success bg-success-bg/50",
    WARNING: "border-l-4 border-warning bg-warning-bg/50",
    ERROR: "border-l-4 border-danger bg-danger-bg/50",
  };

  const typeBadgeColors = {
    INFO: "#2563eb",
    SUCCESS: "#16a34a",
    WARNING: "#d97706",
    ERROR: "#dc2626",
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
      <div
        className={cn(
          "p-4 rounded-r-2xl",
          typeStyles[notification.type],
          !notification.read && "font-semibold"
        )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-semibold text-text">
                {notification.title}
              </h3>
              <Badge backgroundColor={typeBadgeColors[notification.type]}>
                {notification.type}
              </Badge>
              {!notification.read && <Badge backgroundColor="#2563eb">New</Badge>}
            </div>
            <p className="text-sm text-text-muted whitespace-pre-wrap">
              {notification.content}
            </p>
            <NotificationActions
              actions={notification.actions}
              notificationId={notification.id}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-text-muted">
              {new Date(notification.createdAt).toLocaleDateString()}
            </div>
            <IconButton
              variant="danger"
              size="sm"
              clicked={() => setIsDeleteDialogOpen(true)}
              ariaLabel="Delete notification">
              <HiTrash className="size-4" />
            </IconButton>
          </div>
        </div>
      </div>

      <DeleteDialog
        title="Delete Notification"
        content={
          <p className="text-text-muted">
            Are you sure you want to delete this notification? This action cannot be
            undone.
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
