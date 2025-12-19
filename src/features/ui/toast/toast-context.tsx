"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { IToast, IToastContext, IToastOptions, IToastPosition } from "./types";

const ToastContext = createContext<IToastContext | null>(null);

const ANIMATION_DURATION = 300;

let toastIdCounter = 0;

interface IToastProviderProps {
  children: ReactNode;
  /** Default position for all toasts. Default: "bottom-right" */
  defaultPosition?: IToastPosition;
}

export function ToastProvider({
  children,
  defaultPosition = "bottom-right",
}: IToastProviderProps) {
  const [toasts, setToasts] = useState<IToast[]>([]);

  const addToast = useCallback(
    (options: IToastOptions): string => {
      const id = `toast-${++toastIdCounter}`;
      const toast: IToast = {
        id,
        message: options.message,
        variant: options.variant ?? "info",
        duration: options.duration ?? 3000,
        title: options.title,
        showCloseButton: options.showCloseButton ?? true,
        isExiting: false,
        position: options.position ?? defaultPosition,
      };

      setToasts((prev) => [...prev, toast]);
      return id;
    },
    [defaultPosition]
  );

  const startExiting = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );

    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, ANIMATION_DURATION);
  }, []);

  const removeToast = useCallback(
    (id: string) => {
      startExiting(id);
    },
    [startExiting]
  );

  const clearAll = useCallback(() => {
    setToasts((prev) => prev.map((t) => ({ ...t, isExiting: true })));

    setTimeout(() => {
      setToasts([]);
    }, ANIMATION_DURATION);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        defaultPosition,
        addToast,
        removeToast,
        startExiting,
        clearAll,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}
