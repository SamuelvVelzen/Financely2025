import { cn } from "@/features/util/cn";
import { useLayoutEffect, useRef } from "react";
import { Toast } from "./toast";
import { useToastContext } from "./toast-context";
import type { IToastPosition } from "./types";

/** Re-open so the host is placed on top of other top-layer elements (e.g. modals). */
function showPopoverOnTop(element: HTMLElement) {
  try {
    if (element.matches(":popover-open")) {
      element.hidePopover();
    }
    element.showPopover();
  } catch {
    // Popover API unsupported — fixed positioning + z-index fallback below.
  }
}

const positionClasses: Record<IToastPosition, string> = {
  "top-left": "top-4 left-4 items-start flex-col",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center flex-col",
  "top-right": "top-4 right-4 items-end flex-col",
  "bottom-left": "bottom-4 left-4 items-start flex-col-reverse",
  "bottom-center":
    "bottom-4 left-1/2 -translate-x-1/2 items-center flex-col-reverse",
  "bottom-right": "bottom-4 right-4 items-end flex-col-reverse",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastContext();
  const hostRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (toasts.length === 0) {
      if (host.matches(":popover-open")) {
        host.hidePopover();
      }
      return;
    }

    showPopoverOnTop(host);
  }, [toasts]);

  if (toasts.length === 0) {
    return null;
  }

  // Group toasts by position
  const toastsByPosition = toasts.reduce(
    (acc, toast) => {
      if (!acc[toast.position]) {
        acc[toast.position] = [];
      }
      acc[toast.position].push(toast);
      return acc;
    },
    {} as Record<IToastPosition, typeof toasts>
  );

  return (
    <div
      ref={hostRef}
      popover="manual"
      className={cn(
        "toast-popover-host",
        "fixed inset-0 pointer-events-none",
        "m-0 p-0 border-0 bg-transparent overflow-visible",
        "not-[:popover-open]:hidden",
        // Fallback when Popover API is unavailable (e.g. bottom sheets)
        "z-[200]"
      )}
      aria-live="polite"
      aria-label="Notifications">
      {(
        Object.entries(toastsByPosition) as [IToastPosition, typeof toasts][]
      ).map(([position, positionToasts]) => (
        <div
          key={position}
          className={cn(
            "fixed flex gap-2 max-h-[calc(100vh-2rem)] overflow-y-auto",
            positionClasses[position]
          )}>
          {positionToasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto">
              <Toast
                toast={toast}
                onRemove={removeToast}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
