import { useCallback } from "react";
import { useToastContext } from "./toast-context";
import type { IToastOptions } from "./types";

type IToastMethodOptions = Omit<IToastOptions, "message" | "variant" | "title">;

/**
 * Hook for showing toast notifications
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * toast.success("Transaction saved!");
 * toast.error("Failed to delete", { duration: 5000 });
 * toast.info("Info", "Processing...", { duration: 0 }); // manual dismiss only
 * toast.warning("Warning", "Low balance");
 * ```
 */
export function useToast() {
  const { addToast, removeToast, clearAll } = useToastContext();

  const success = useCallback(
    (message: string, options?: IToastMethodOptions) => {
      return addToast({
        title: "Success",
        message,
        variant: "success",
        ...options,
      });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: IToastMethodOptions) => {
      return addToast({
        title: "Error",
        message,
        variant: "danger",
        ...options,
      });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message: string, options?: IToastMethodOptions) => {
      return addToast({ title, message, variant: "info", ...options });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message: string, options?: IToastMethodOptions) => {
      return addToast({ title, message, variant: "warning", ...options });
    },
    [addToast]
  );

  const show = useCallback(
    (options: IToastOptions) => {
      return addToast(options);
    },
    [addToast]
  );

  const dismiss = useCallback(
    (id: string) => {
      removeToast(id);
    },
    [removeToast]
  );

  return {
    success,
    error,
    info,
    warning,
    show,
    dismiss,
    clearAll,
  };
}
