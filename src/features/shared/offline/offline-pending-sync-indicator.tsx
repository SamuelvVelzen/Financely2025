import { OfflinePendingSyncManagerDialog } from "@/features/shared/offline/offline-pending-sync-manager-dialog";
import { requestOfflineSync } from "@/features/shared/offline/offline-sync-request";
import { usePendingOfflineMutations } from "@/features/shared/offline/use-pending-offline-mutations";
import { useOnlineStatus } from "@/features/shared/hooks/use-online-status";
import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/features/util/cn";
import { useState } from "react";
import { HiArrowPath, HiPencil } from "react-icons/hi2";

type IOfflinePendingSyncIndicatorProps = {
  className?: string;
};

/**
 * Compact badge shown when local changes are waiting to sync.
 * Click to retry sync manually after an automatic attempt fails.
 * When sync is blocked, an edit icon opens a dialog to review or remove changes.
 */
export function OfflinePendingSyncIndicator({
  className,
}: IOfflinePendingSyncIndicatorProps) {
  const { pendingCount, hasSyncIssues } = usePendingOfflineMutations();
  const isOnline = useOnlineStatus();
  const [managerOpen, setManagerOpen] = useState(false);

  if (pendingCount === 0) return null;

  const label =
    pendingCount === 1
      ? "1 change pending sync"
      : `${pendingCount} changes pending sync`;

  return (
    <>
      <div className={cn("inline-flex items-center gap-1", className)}>
        <button
          type="button"
          onClick={() => requestOfflineSync()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isOnline
              ? "bg-warning/15 text-warning"
              : "bg-muted text-muted-foreground",
          )}
          title={
            isOnline
              ? hasSyncIssues
                ? "Tap to retry sync, or use the edit icon to review changes"
                : "Tap to sync saved changes now"
              : "Saved on this device — will sync when you reconnect"
          }
          aria-live="polite"
        >
          <HiArrowPath className="size-3.5 shrink-0" aria-hidden />
          <span>{label}</span>
        </button>
        {hasSyncIssues ? (
          <IconButton
            size="sm"
            className="text-warning hover:text-warning"
            icon={<HiPencil className="size-3.5" />}
            clicked={() => setManagerOpen(true)}
            tooltip="Review pending changes"
            aria-label="Review pending changes"
          />
        ) : null}
      </div>
      <OfflinePendingSyncManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
      />
    </>
  );
}
