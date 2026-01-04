import { cn } from "@/features/util/cn";
import { cloneElement, isValidElement, useEffect, useRef } from "react";
import type { IDialogTriggerProps } from "./types";

/**
 * DialogTrigger component wraps an element to bind dialog open/close behavior
 *
 * Features:
 * - Automatically handles click to toggle dialog
 * - Stores trigger reference for focus restoration
 * - Non-invasive: opt-in only
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <DialogTrigger open={open} onOpenChange={setOpen}>
 *   <button>Open Dialog</button>
 * </DialogTrigger>
 * <Dialog open={open} onOpenChange={setOpen}>
 *   Content
 * </Dialog>
 * ```
 */
export function DialogTrigger({
  children,
  open,
  onOpenChange,
  className = "",
  asChild = false,
}: IDialogTriggerProps) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const triggerIdRef = useRef<string | null>(null);

  // Generate unique ID for trigger
  useEffect(() => {
    if (!triggerIdRef.current && typeof window !== "undefined") {
      triggerIdRef.current = `dialog-trigger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Store trigger reference in sessionStorage for focus restoration
  useEffect(() => {
    if (
      triggerRef.current &&
      triggerIdRef.current &&
      typeof window !== "undefined"
    ) {
      triggerRef.current.id = triggerIdRef.current;
      sessionStorage.setItem("dialog-trigger-id", triggerIdRef.current);
    }
  }, []);

  const handleClick = () => {
    onOpenChange?.(!open);
  };

  // Clone child element and add props
  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node;
        // Call original ref if it exists
        const originalRef = (children as any).ref;
        if (typeof originalRef === "function") {
          originalRef(node);
        } else if (originalRef) {
          originalRef.current = node;
        }
      },
      onClick: (e: React.MouseEvent) => {
        handleClick();
        // Call original onClick if it exists
        const originalOnClick = (children.props as any).onClick;
        if (originalOnClick) {
          originalOnClick(e);
        }
      },
      className: cn(className, (children.props as any).className),
    } as any);
  }

  // Wrap in button if not asChild
  return (
    <button
      ref={triggerRef as React.Ref<HTMLButtonElement>}
      onClick={handleClick}
      className={className}
      type="button">
      {children}
    </button>
  );
}
