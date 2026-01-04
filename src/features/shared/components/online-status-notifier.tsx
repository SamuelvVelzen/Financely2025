import { useToast } from "@/features/ui/toast";
import { useEffect, useRef } from "react";
import { useOnlineStatus } from "../hooks/use-online-status";

/**
 * Component that tracks online/offline status and shows toast notifications
 * when the status changes. Should be placed in the root layout.
 */
export function OnlineStatusNotifier() {
  const isOnline = useOnlineStatus();
  const toast = useToast();
  const previousStatusRef = useRef<boolean | null>(null);
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip initial render
    if (previousStatusRef.current === null) {
      previousStatusRef.current = isOnline;
      return;
    }

    // Only show notification if status changed
    if (previousStatusRef.current !== isOnline) {
      // Dismiss previous toast if exists
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      if (isOnline) {
        toastIdRef.current = toast.show({
          title: "Connection Restored",
          message: "You are back online",
          variant: "success",
          position: "top-center",
          duration: 0, // Don't auto-dismiss
        });
      } else {
        toastIdRef.current = toast.show({
          title: "No Internet Connection",
          message: "Please check your internet connection",
          variant: "warning",
          position: "top-center",
          duration: 0, // Don't auto-dismiss
        });
      }

      previousStatusRef.current = isOnline;
    }
  }, [isOnline, toast]);

  return null;
}
