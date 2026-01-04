import { cn } from "@/features/util/cn";
import { Toast } from "./toast";
import { useToastContext } from "./toast-context";
import type { IToastPosition } from "./types";

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
    <>
      {(
        Object.entries(toastsByPosition) as [IToastPosition, typeof toasts][]
      ).map(([position, positionToasts]) => (
        <div
          key={position}
          className={cn(
            "fixed z-50 flex gap-2 max-h-[calc(100vh-2rem)] overflow-y-auto",
            positionClasses[position]
          )}
          aria-live="polite"
          aria-label="Notifications">
          {positionToasts.map((toast) => (
            <Toast
              key={toast.id}
              toast={toast}
              onRemove={removeToast}
            />
          ))}
        </div>
      ))}
    </>
  );
}
