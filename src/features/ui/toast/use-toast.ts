"use client";

import { useCallback } from "react";
import { useToastContext } from "./toast-context";
import type { IToastOptions } from "./types";

type IToastMethodOptions = Omit<IToastOptions, "message" | "variant">;

/**
 * Hook for showing toast notifications
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * toast.success("Transaction saved!");
 * toast.error("Failed to delete", { duration: 5000 });
 * toast.info("Processing...", { duration: 0 }); // manual dismiss only
 * toast.warning("Low balance");
 * ```
 */
export function useToast() {
  const { addToast, removeToast, clearAll } = useToastContext();

  const success = useCallback(
    (message: string, options?: IToastMethodOptions) => {
      return addToast({ message, variant: "success", ...options });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: IToastMethodOptions) => {
      return addToast({ message, variant: "danger", ...options });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: IToastMethodOptions) => {
      return addToast({ message, variant: "info", ...options });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: IToastMethodOptions) => {
      return addToast({ message, variant: "warning", ...options });
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

