import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";
import type { IButtonProps } from "../button/button";

/**
 * Dialog variant determines the layout and behavior
 */
export type DialogVariant = "modal" | "fullscreen";

/**
 * Dialog size for modal variant
 */
export type DialogSize = "sm" | "md" | "lg" | "xl" | "full";

/**
 * Event handlers for dialog lifecycle
 */
export interface DialogEvents {
  /** Called when dialog opens */
  onOpen?: () => void;
  /** Called when dialog closes */
  onClose?: () => void;
  /** Called after dialog opens (after animation) */
  onAfterOpen?: () => void;
  /** Called after dialog closes (after animation) */
  onAfterClose?: () => void;
}

/**
 * Base props for Dialog component
 */
export interface DialogProps
  extends PropsWithChildren,
    PropsWithClassName,
    DialogEvents {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Whether dialog can be dismissed (by clicking overlay or pressing Esc) */
  dismissible?: boolean;
  /** Whether to render in a portal (default: true) */
  portal?: boolean;
  /** Portal container element (default: document.body) */
  portalContainer?: HTMLElement;
  /** Keep dialog mounted when closed (for animations) */
  keepMounted?: boolean;
  /** Dialog variant */
  variant?: DialogVariant;
  /** Dialog size (for modal variant) */
  size?: DialogSize;
  /** Custom transition className */
  transitionClassName?: string;
  /** ARIA label for dialog */
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
  /** Whether body content is scrollable */
  scrollable?: boolean;
}

/**
 * Props for DialogOverlay component
 */
export interface DialogOverlayProps extends PropsWithClassName {
  /** Whether overlay is dismissible */
  dismissible?: boolean;
  /** Click handler for overlay */
  onClick?: () => void;
  /** Open state */
  open?: boolean;
}

/**
 * Props for DialogHeader component
 */
export interface DialogHeaderProps
  extends PropsWithChildren,
    PropsWithClassName {
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
export interface DialogBodyProps extends PropsWithChildren, PropsWithClassName {
  /** Whether body is scrollable */
  scrollable?: boolean;
}

/**
 * Props for DialogFooter component
 */
export interface DialogFooterProps
  extends PropsWithChildren,
    PropsWithClassName {
  /** Alignment of footer content */
  align?: "left" | "right" | "between";
  /** Dense spacing mode */
  dense?: boolean;
}

/**
 * Props for DialogActions component
 */
export interface DialogActionsProps
  extends PropsWithChildren,
    PropsWithClassName {
  /** Alignment of actions */
  align?: "left" | "right" | "between";
}

/**
 * Props for DialogTrigger component
 */
export interface DialogTriggerProps
  extends PropsWithChildren,
    PropsWithClassName {
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
export interface UseDialogReturn {
  /** Current open state */
  isOpen: boolean;
  /** Open the dialog */
  open: () => void;
  /** Close the dialog */
  close: () => void;
  /** Toggle the dialog */
  toggle: () => void;
}
