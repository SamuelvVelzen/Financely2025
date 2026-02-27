import { IVariant } from "../button/button";

export type IToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface IToast {
  id: string;
  message: string;
  variant: IVariant;
  duration: number;
  title: string;
  showCloseButton: boolean;
  isExiting: boolean;
  position: IToastPosition;
  onClick?: () => void;
}

export interface IToastOptions {
  message: string;
  variant?: IVariant;
  /** Duration in ms. Default: 3000. Set to 0 for no auto-dismiss. */
  duration?: number;
  title: string;
  /** Whether to show close button. Default: true */
  showCloseButton?: boolean;
  /** Position of the toast. Default: uses container's default position */
  position?: IToastPosition;
  /** Optional click handler for the toast */
  onClick?: () => void;
}

export interface IToastContext {
  toasts: IToast[];
  defaultPosition: IToastPosition;
  addToast: (options: IToastOptions) => string;
  removeToast: (id: string) => void;
  startExiting: (id: string) => void;
  clearAll: () => void;
}
