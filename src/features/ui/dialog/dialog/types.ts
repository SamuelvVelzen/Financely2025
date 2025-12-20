import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";
import type { IButtonProps } from "../../button/button";

/**
 * Dialog variant determines the layout and behavior
 */
export type IDialogVariant = "modal" | "fullscreen";

/**
 * Dialog size for modal variant
 */
export type IDialogSize = "sm" | "md" | "lg" | "xl" | "1/2" | "3/4" | "full";

/**
 * Dialog status determines the color theme
 */
export type IDialogStatus = "danger" | "info" | "warning" | "success";

/**
 * Event handlers for dialog lifecycle
 */
export interface IDialogEvents {
  /** Called when dialog closes */
  onClose?: () => void;
}

/**
 * Base props for Dialog component
 */
export interface IDialogProps
  extends PropsWithChildren,
    IPropsWithClassName,
    IDialogEvents {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether dialog can be dismissed (by clicking overlay or pressing Esc) */
  dismissible?: boolean;

  /** Dialog variant */
  variant?: IDialogVariant;
  /** Dialog size (for modal variant) */
  size?: IDialogSize;
  /** Dialog status determines the color theme */
  status?: IDialogStatus;

  "aria-label"?: string;
  /** ARIA labelled by element id */
  "aria-labelledby"?: string;
  /** Custom style */
  style?: React.CSSProperties;
  /** Title for header (string or ReactNode) */
  title: string;
  /** Content for body (string or ReactNode). If not provided, children will be used */
  content?: string | React.ReactNode;
  /** Footer buttons (array of button props). Always rendered */
  footerButtons?: IButtonProps[];
}

/**
 * Props for DialogOverlay component
 */
export interface IDialogOverlayProps extends IPropsWithClassName {
  /** Whether overlay is dismissible */
  dismissible?: boolean;
  /** Click handler for overlay */
  onClick?: () => void;
  /** Open state */
  open?: boolean;
  /** Dialog ID for stacking */
  dialogId?: string;
}

/**
 * Props for DialogHeader component
 */
export interface IDialogHeaderProps
  extends PropsWithChildren,
    IPropsWithClassName {
  /** Title element (for aria-labelledby) */
  titleId?: string;
  /** Show close button */
  showCloseButton?: boolean;
  /** Close button click handler */
  onClose?: () => void;
}

/**
 * Props for DialogBody component
 */
export interface IDialogBodyProps
  extends PropsWithChildren,
    IPropsWithClassName {
  /** Whether body is scrollable */
  scrollable?: boolean;
}

/**
 * Props for DialogFooter component
 */
export interface IDialogFooterProps
  extends PropsWithChildren,
    IPropsWithClassName {
  /** Alignment of footer content */
  align?: "left" | "right" | "between";
  /** Dense spacing mode */
  dense?: boolean;
}

/**
 * Props for DialogActions component
 */
export interface IDialogActionsProps
  extends PropsWithChildren,
    IPropsWithClassName {
  /** Alignment of actions */
  align?: "left" | "right" | "between";
}

/**
 * Props for DialogTrigger component
 */
export interface IDialogTriggerProps
  extends PropsWithChildren,
    IPropsWithClassName {
  /** Dialog open state */
  open?: boolean;
  /** Open change handler */
  onOpenChange?: (open: boolean) => void;
  /** Trigger element (optional, wraps children if not provided) */
  asChild?: boolean;
}

/**
 * Return type for useDialog hook
 */
export interface IUseDialogReturn {
  /** Current open state */
  isOpen: boolean;
  /** Open the dialog */
  open: () => void;
  /** Close the dialog */
  close: () => void;
  /** Toggle the dialog */
  toggle: () => void;
}
