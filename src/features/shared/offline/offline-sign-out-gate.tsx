import { countOfflineMutationsForCurrentUser } from "@/features/shared/offline/offline-mutation-outbox";
import {
  SIGN_OUT_REQUEST_EVENT,
} from "@/features/shared/offline/request-sign-out";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import {
  signOutFromApp,
  type ISignOutFromAppOptions,
} from "@/lib/auth-client";
import { useCallback, useEffect, useState } from "react";

/**
 * Intercepts sign-out when unsynced offline mutations exist.
 */
export function OfflineSignOutGate() {
  const [open, setOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [options, setOptions] = useState<ISignOutFromAppOptions | undefined>();

  const performSignOut = useCallback(async () => {
    await signOutFromApp(options);
  }, [options]);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<ISignOutFromAppOptions>).detail;
      void (async () => {
        const count = await countOfflineMutationsForCurrentUser();
        if (count === 0) {
          await signOutFromApp(detail);
          return;
        }
        setOptions(detail);
        setPendingCount(count);
        setOpen(true);
      })();
    };

    window.addEventListener(SIGN_OUT_REQUEST_EVENT, handler);
    return () => window.removeEventListener(SIGN_OUT_REQUEST_EVENT, handler);
  }, []);

  return (
    <DeleteDialog
      open={open}
      onOpenChange={setOpen}
      title="Unsynced changes on this device"
      content={
        <p>
          You have {pendingCount} change{pendingCount === 1 ? "" : "s"} saved
          locally that have not synced yet. Signing out will discard them.
        </p>
      }
      footerButtons={[
        {
          buttonContent: "Stay signed in",
          clicked: () => setOpen(false),
        },
        {
          buttonContent: "Sign out anyway",
          clicked: () => {
            setOpen(false);
            void performSignOut();
          },
          variant: "danger",
        },
      ]}
    />
  );
}
