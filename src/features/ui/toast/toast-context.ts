import { createContext, useContext } from "react";
import type {
  IToast,
  IToastContext,
  IToastOptions,
  IToastPosition,
} from "./types";

export const ToastContext = createContext<IToastContext | null>(null);

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}

export type { IToast, IToastContext, IToastOptions, IToastPosition };
