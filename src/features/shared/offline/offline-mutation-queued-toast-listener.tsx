import {
  OFFLINE_MUTATION_DEFAULT_DETAIL,
  OFFLINE_MUTATION_QUEUED_EVENT,
  type IOfflineMutationQueuedDetail,
} from "@/features/shared/offline/offline-mutation-errors";
import { useToast } from "@/features/ui/toast";
import { useEffect } from "react";

/**
 * One success-style toast when a JSON mutation was queued for offline sync.
 */
export function OfflineMutationQueuedToastListener() {
  const toast = useToast();

  useEffect(() => {
    const handler = (ev: Event) => {
      const ce = ev as CustomEvent<IOfflineMutationQueuedDetail>;
      const detail = ce.detail;
      if (!detail?.queueId) return;

      toast.show({
        title: detail.successTitle ?? "Saved successfully",
        message: detail.successMessage ?? OFFLINE_MUTATION_DEFAULT_DETAIL,
        variant: "success",
        position: "top-center",
      });
    };
    window.addEventListener(OFFLINE_MUTATION_QUEUED_EVENT, handler);
    return () =>
      window.removeEventListener(OFFLINE_MUTATION_QUEUED_EVENT, handler);
  }, [toast]);

  return null;
}
