import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { BottomSheet } from "./bottom-sheet";
import { Dialog } from "./dialog/dialog";
import type { IResponsiveDialogProps } from "./dialog/types";

export type { IResponsiveDialogProps };

/**
 * Shared overlay parent: bottom sheet on mobile, centered dialog on desktop.
 * Feature code should call this instead of choosing BottomSheet vs Dialog.
 */
export function ResponsiveDialog({
  children,
  open,
  onOpenChange,
  dismissible,
  variant,
  size,
  status,
  ariaLabel,
  ariaLabelledBy,
  className,
  style,
  onClose,
  title,
  headerActions,
  content,
  footerButtons,
  initialFocusRef,
  disableInitialFocus,
}: IResponsiveDialogProps) {
  const { isMobile } = useResponsive();
  const body = content !== undefined ? content : children;

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        dismissible={dismissible}
        title={title}
        headerActions={headerActions}
        footerButtons={footerButtons}
        ariaLabel={ariaLabel}
        ariaLabelledBy={ariaLabelledBy}
        className={className}
        style={style}
        onClose={onClose}
        initialFocusRef={initialFocusRef}
        disableInitialFocus={disableInitialFocus}>
        {body}
      </BottomSheet>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      variant={variant}
      size={size}
      status={status}
      ariaLabel={ariaLabel}
      ariaLabelledBy={ariaLabelledBy}
      className={className}
      style={style}
      onClose={onClose}
      title={title}
      headerActions={headerActions}
      content={body}
      footerButtons={footerButtons}
      initialFocusRef={initialFocusRef}
      disableInitialFocus={disableInitialFocus}
    />
  );
}
