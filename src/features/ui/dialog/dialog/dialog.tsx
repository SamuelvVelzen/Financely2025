import { cn } from "@/features/util/cn";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiX } from "react-icons/hi";
import { Button } from "../../button/button";
import { IconButton } from "../../button/icon-button";
import type { IDialogProps, IDialogStatus } from "./types";
import { getPrimaryFooterButtonIndex, useFocusTrap } from "./use-focus-trap";

/**
 * Dialog component provides a fully accessible modal dialog system using native <dialog>
 *
 * Features:
 * - Native <dialog> element with showModal()/close()
 * - Native ::backdrop styling
 * - Built-in focus trap and ESC key handling
 * - Automatic top-layer stacking
 * - Controlled and uncontrolled modes
 * - Multiple variants (modal, fullscreen)
 *
 * @example
 * ```tsx
 * // Simple usage with title and content
 * <Dialog
 *   title="Dialog Title"
 *   content="Dialog content text"
 *   footerButtons={[{ children: "Close", clicked: () => setOpen(false) }]}
 *   open={open}
 *   onOpenChange={setOpen}
 * />
 * ```
 */
export function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
  dismissible = true,
  variant = "modal",
  size = "md",
  status,
  ariaLabel,
  ariaLabelledBy,
  className = "",
  style,
  onClose,
  title,
  headerActions,
  content,
  footerButtons,
  initialFocusRef,
  disableInitialFocus = false,
}: IDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primaryFooterButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Determine if controlled or uncontrolled
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  // Handle open state changes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [isControlled, onOpenChange]
  );

  // Sync dialog element with open state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      // Store the previously focused element for restoration
      previousActiveElement.current =
        (document.activeElement as HTMLElement) || null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      onClose?.();

      // Restore focus to previous element
      setTimeout(() => {
        previousActiveElement.current?.focus();
        previousActiveElement.current = null;
      }, 0);
    }
  }, [open, onClose]);

  const handleClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  // Handle native dialog close event (ESC key, form submission)
  const handleDialogClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  // Handle backdrop click (only if dismissible)
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      // Check if click is on the backdrop (dialog element itself, not its children)
      if (e.target === e.currentTarget && dismissible) {
        handleClose();
      }
    },
    [dismissible, handleClose]
  );

  // Handle cancel event (ESC key) - prevent if not dismissible
  const handleCancel = useCallback(
    (e: React.SyntheticEvent<HTMLDialogElement>) => {
      if (!dismissible) {
        e.preventDefault();
      }
    },
    [dismissible]
  );

  // Generate title ID for aria-labelledby if title is provided
  const titleId = useMemo(
    () =>
      title
        ? `dialog-title-${Math.random().toString(36).substr(2, 9)}`
        : undefined,
    [title]
  );
  const finalAriaLabelledBy = ariaLabelledBy || titleId;

  const sizeClasses = {
    sm: "max-w-full sm:max-w-sm",
    md: "max-w-full sm:max-w-md",
    lg: "max-w-full sm:max-w-lg",
    xl: "max-w-full sm:max-w-xl",
    "1/2": "max-w-full sm:max-w-1/2",
    "3/4": "max-w-full sm:max-w-3/4",
    full: "max-w-full",
  };

  const variantClasses = {
    modal: cn(
      sizeClasses[size],
      "w-[calc(100%-2rem)] max-h-[90vh]",
      // Center the dialog
      "m-auto"
    ),
    fullscreen: cn("w-full h-full max-w-none max-h-none m-0"),
  };

  const baseClasses = cn(
    "bg-surface border border-border rounded-2xl",
    "shadow-lg outline-none",
    "flex flex-col overflow-hidden",
    // Reset default dialog styles
    "p-0",
    "not-[[open]]:hidden",
    variantClasses[variant],
    className
  );

  // Determine content to display (content prop takes precedence over children)
  const bodyContent = content !== undefined ? content : children;

  const primaryFooterButtonIndex = useMemo(
    () => getPrimaryFooterButtonIndex(footerButtons),
    [footerButtons]
  );

  const resolvedInitialFocusRef =
    initialFocusRef ??
    (primaryFooterButtonIndex >= 0 ? primaryFooterButtonRef : undefined);

  const { handleKeyDown } = useFocusTrap({
    enabled: open,
    containerRef: dialogRef,
    initialFocusRef: resolvedInitialFocusRef,
    disableInitialFocus:
      disableInitialFocus || resolvedInitialFocusRef === undefined,
    onEscape: dismissible ? handleClose : undefined,
  });

  const statusClasses: Record<IDialogStatus | "none", string> = {
    none: "",
    danger: "text-danger",
    info: "text-info",
    warning: "text-warning",
    success: "text-success",
  };



  return (
    <dialog
      ref={dialogRef}
      aria-label={ariaLabel}
      aria-labelledby={finalAriaLabelledBy}
      data-variant={variant}
      data-size={size}
      data-status={status}
      className={baseClasses}
      style={style}
      onClick={handleDialogClick}
      onClose={handleDialogClose}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}>
      {/* Header - Always rendered */}
      <header
        className={cn(
          "flex items-center justify-between gap-4 px-6 py-4 border-b border-border"
        )}
        id={titleId}>
        <div className="flex-1">
          <h2
            className={cn(
              "text-xl font-semibold",
              statusClasses[status ?? "none"]
            )}>
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerActions}
          <IconButton clicked={handleClose}>
            <HiX className="size-5" />
          </IconButton>
        </div>
      </header>

      <div className={"px-6 py-4 overflow-y-auto"}>{bodyContent}</div>

      {footerButtons && footerButtons.length > 0 && (
        <footer
          className={
            "flex items-center gap-3 px-6 py-4 border-t border-border justify-end "
          }>
          {footerButtons?.map((buttonProps, index) => (
            <Button
              key={index}
              {...buttonProps}
              ref={
                index === primaryFooterButtonIndex
                  ? primaryFooterButtonRef
                  : undefined
              }
            />
          ))}
        </footer>
      )}
    </dialog>
  );
}
