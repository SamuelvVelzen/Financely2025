import {
  collectDependentMutationIds,
  deleteOfflineMutationWithDependents,
  getOfflineOutboxUserId,
  type IOfflineMutationRecord,
} from "@/features/shared/offline/offline-mutation-outbox";
import {
  formatOfflineMutationTime,
  summarizeOfflineMutation,
} from "@/features/shared/offline/offline-mutation-label";
import { requestOfflineSync } from "@/features/shared/offline/offline-sync-request";
import { usePendingOfflineMutations } from "@/features/shared/offline/use-pending-offline-mutations";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { IconButton } from "@/features/ui/button/icon-button";
import { useToast } from "@/features/ui/toast";
import { cn } from "@/features/util/cn";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { HiTrash } from "react-icons/hi2";

function parseInvalidateBases(json: string): unknown[][] {
  try {
    const raw = JSON.parse(json) as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((x): x is unknown[] => Array.isArray(x));
  } catch {
    return [];
  }
}

function invalidateDeletedMutations(
  queryClient: ReturnType<typeof useQueryClient>,
  deleted: IOfflineMutationRecord[],
): void {
  for (const row of deleted) {
    for (const base of parseInvalidateBases(row.invalidateBasesJson)) {
      queryClient.invalidateQueries({ queryKey: base });
    }
  }
}

type IOfflinePendingSyncManagerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OfflinePendingSyncManagerDialog({
  open,
  onOpenChange,
}: IOfflinePendingSyncManagerDialogProps) {
  const { mutations } = usePendingOfflineMutations();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (mutation: IOfflineMutationRecord) => {
      const userId = getOfflineOutboxUserId();
      if (!userId) return;

      const dependentCount =
        collectDependentMutationIds(mutations, mutation).length - 1;

      setDeletingId(mutation.id);
      try {
        const deleted = await deleteOfflineMutationWithDependents(
          userId,
          mutation.id,
        );
        invalidateDeletedMutations(queryClient, deleted);

        const message =
          dependentCount > 0
            ? `Removed ${deleted.length} queued changes that depended on this item.`
            : "Removed from the sync queue.";

        toast.show({
          title: "Change removed",
          message,
          variant: "success",
          position: "top-center",
        });

        if (mutations.length - deleted.length === 0) {
          onOpenChange(false);
        }
      } catch {
        toast.warning(
          "Could not remove change",
          "Try again or refresh the page.",
          { position: "top-center" },
        );
      } finally {
        setDeletingId(null);
      }
    },
    [mutations, onOpenChange, queryClient, toast],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Pending changes"
      size="md"
      content={
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            These changes are saved on this device and will sync when possible.
            Remove any you no longer want to send.
          </p>
          {mutations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing pending.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {mutations.map((mutation) => {
                const summary = summarizeOfflineMutation(mutation);
                const dependentCount =
                  collectDependentMutationIds(mutations, mutation).length - 1;
                const isDeleting = deletingId === mutation.id;

                return (
                  <li
                    key={mutation.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border border-border p-3",
                      mutation.syncBlocked && "border-warning/40 bg-warning/5",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{summary.title}</p>
                      {summary.detail ? (
                        <p className="truncate text-sm text-muted-foreground">
                          {summary.detail}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatOfflineMutationTime(mutation.createdAt)}
                      </p>
                      {mutation.lastSyncError ? (
                        <p className="mt-1 text-xs text-warning">
                          {mutation.lastSyncError}
                        </p>
                      ) : null}
                      {dependentCount > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Removing this also removes {dependentCount} linked
                          change{dependentCount === 1 ? "" : "s"}.
                        </p>
                      ) : null}
                    </div>
                    <IconButton
                      size="sm"
                      variant="danger"
                      icon={<HiTrash className="size-4" />}
                      clicked={() => void handleDelete(mutation)}
                      disabled={isDeleting}
                      tooltip="Remove from queue"
                      aria-label="Remove from queue"
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      }
      footerButtons={[
        {
          children: "Close",
          variant: "secondary",
          clicked: () => onOpenChange(false),
        },
        {
          children: "Retry sync",
          variant: "primary",
          clicked: () => {
            requestOfflineSync();
          },
          disabled: mutations.length === 0,
        },
      ]}
    />
  );
}
