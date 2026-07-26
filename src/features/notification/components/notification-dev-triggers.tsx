import { useCreateNotification } from "@/features/notification/hooks/useNotifications";
import {
  buildSampleNotificationInput,
  buildSampleNotificationPack,
} from "@/features/notification/utils/build-sample-notification-input";
import { NOTIFICATION_TYPE_META } from "@/features/notification/utils/notification-type-meta";
import type { INotificationType } from "@/features/shared/validation/enums";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { Button, type IVariant } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { useToast } from "@/features/ui/toast";
import { useState } from "react";

const TYPE_BUTTON_VARIANT: Record<INotificationType, IVariant> = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "danger",
};

const TYPE_ENTRIES = Object.entries(NOTIFICATION_TYPE_META) as [
  INotificationType,
  (typeof NOTIFICATION_TYPE_META)[INotificationType],
][];

/**
 * Dev-only controls to create sample notifications for UI/filter testing.
 * Rendered only when `import.meta.env.DEV` is true.
 */
export function NotificationDevTriggers() {
  const createNotification = useCreateNotification();
  const toast = useToast();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  if (!import.meta.env.DEV) {
    return null;
  }

  const isBusy = pendingKey !== null;

  const createOne = async (type: INotificationType) => {
    setPendingKey(type);
    try {
      const result = await createNotification.mutateAsync(
        buildSampleNotificationInput(type),
      );
      if (!isOfflineMutationPlaceholder(result)) {
        toast.success(`${NOTIFICATION_TYPE_META[type].label} notification added`);
      }
    } catch {
      toast.error("Failed to create notification");
    } finally {
      setPendingKey(null);
    }
  };

  const createPack = async () => {
    setPendingKey("pack");
    try {
      const pack = buildSampleNotificationPack();
      for (const input of pack) {
        await createNotification.mutateAsync(input);
      }
      toast.success(`Added ${pack.length} sample notifications`);
    } catch {
      toast.error("Failed to create sample pack");
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <Container className="mb-3">
      <div className="rounded-2xl border border-dashed border-border bg-surface-hover/30 px-3 py-2.5">
        <p className="mb-2 text-xs font-medium text-text-muted">
          Dev triggers — create sample notifications
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_ENTRIES.map(([type, meta]) => (
            <Button
              key={type}
              size="xs"
              variant={TYPE_BUTTON_VARIANT[type]}
              disabled={isBusy}
              loading={pendingKey === type}
              clicked={() => {
                void createOne(type);
              }}
              buttonContent={`+ ${meta.label}`}
              ariaLabel={`Create ${meta.label} notification`}
            />
          ))}
          <Button
            size="xs"
            variant="primary"
            disabled={isBusy}
            loading={pendingKey === "pack"}
            clicked={() => {
              void createPack();
            }}
            buttonContent="Sample pack"
            ariaLabel="Create a pack of sample notifications"
          />
        </div>
      </div>
    </Container>
  );
}
