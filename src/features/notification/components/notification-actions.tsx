import type { INotification } from "@/features/shared/validation/schemas";
import { Button } from "@/features/ui/button/button";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { useNavigate } from "@tanstack/react-router";
import { useMarkAsRead } from "../hooks/useNotifications";
import { resolveNotificationCtas } from "../utils/resolve-notification-ctas";

type INotificationActionsProps = {
  notification: INotification;
};

export function NotificationActions({
  notification,
}: INotificationActionsProps) {
  const workspaceId = useActiveWorkspaceId();
  const navigate = useNavigate();
  const markAsRead = useMarkAsRead();
  const ctas = resolveNotificationCtas(notification, workspaceId);

  if (ctas.length === 0) {
    return null;
  }

  const handleCta = async (path: string) => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
    navigate({ to: path });
  };

  return (
    <div
      className="mt-2 flex flex-wrap gap-2"
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}>
      {ctas.map((cta) => (
        <Button
          key={cta.path}
          variant="primary"
          size="sm"
          clicked={() => {
            void handleCta(cta.path);
          }}
          buttonContent={cta.label}
        />
      ))}
    </div>
  );
}
