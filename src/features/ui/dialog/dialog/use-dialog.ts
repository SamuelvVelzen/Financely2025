import { useCallback, useState } from "react";
import type { IUseDialogReturn } from "./types";

/**
 * Hook for imperative dialog control
 *
 * @param props - Optional controlled props
 * @returns Dialog control object with open, close, toggle, and isOpen state
 *
 * @example
 * ```tsx
 * // Uncontrolled usage
 * const dialog = useDialog();
 *
 * return (
 *   <>
 *     <button onClick={dialog.open}>Open</button>
 *     <Dialog open={dialog.isOpen} onOpenChange={dialog.open}>
 *       Content
 *     </Dialog>
 *   </>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Controlled usage (hook ignores internal state)
 * const [open, setOpen] = useState(false);
 * const dialog = useDialog({ open, onOpenChange: setOpen });
 *
 * return (
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     Content
 *   </Dialog>
 * );
 * ```
 */
export function useDialog(props?: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}): IUseDialogReturn {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = props?.open !== undefined ? props.open : internalOpen;

  const open = useCallback(() => {
    if (props?.onOpenChange) {
      props.onOpenChange(true);
    } else {
      setInternalOpen(true);
    }
  }, [props?.onOpenChange]);

  const close = useCallback(() => {
    if (props?.onOpenChange) {
      props.onOpenChange(false);
    } else {
      setInternalOpen(false);
    }
  }, [props?.onOpenChange]);

  const toggle = useCallback(() => {
    if (props?.onOpenChange) {
      props.onOpenChange(!isOpen);
    } else {
      setInternalOpen((prev) => !prev);
    }
  }, [isOpen, props?.onOpenChange]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
