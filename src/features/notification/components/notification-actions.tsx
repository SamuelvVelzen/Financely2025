import type { INotificationAction } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { useNotificationActions } from "../hooks/useNotificationActions";

type INotificationActionsProps = {
  actions: INotificationAction[] | null;
  notificationId: string;
};

export function NotificationActions({
  actions,
  notificationId,
}: INotificationActionsProps) {
  const { handleAction } = useNotificationActions();

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={
            action.variant === "primary"
              ? "primary"
              : action.variant === "danger"
                ? "danger"
                : "default"
          }
          size="sm"
          clicked={() => handleAction(action, notificationId)}
          buttonContent={action.label}
        />
      ))}
    </div>
  );
}
