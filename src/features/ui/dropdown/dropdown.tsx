"use client";

import { cn } from "@/features/util/cn";
import {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { HiDotsVertical } from "react-icons/hi";
import { Button, IButtonProps, IButtonSize } from "../button/button";
import { IconButton } from "../button/icon-button";
import { useDialogContext } from "../dialog/dialog/dialog-context";
import {
  useDropdownPlacement,
  type IPlacementOption,
} from "./hooks/use-dropdown-placement";

const dropdownSizeClasses: { [key in IButtonSize]: { iconClasses: string } } = {
  xs: { iconClasses: "size-3" },
  sm: { iconClasses: "size-4" },
  md: { iconClasses: "size-5" },
  lg: { iconClasses: "size-6" },
};

type IDropdownProps = {
  dropdownSelector?:
    | ReactNode
    | { content: ReactNode; variant: IButtonProps["variant"] };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  expandedContent?: ReactNode;
  showExpanded?: boolean;
  placement?: IPlacementOption | IPlacementOption[];
  /** Whether to close the dropdown when an item is clicked. Defaults to true. */
  closeOnItemClick?: boolean;
  disabled?: boolean;
  size?: IButtonSize;
} & PropsWithChildren;

export function Dropdown({
  children,
  dropdownSelector,
  open: controlledOpen,
  onOpenChange,
  expandedContent,
  showExpanded = false,
  placement,
  closeOnItemClick = true,
  disabled = false,
  size = "md",
}: IDropdownProps) {
  const dialogContext = useDialogContext();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Use controlled state if provided, otherwise use internal state
  const dropdownIsOpen =
    controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setDropdownState = (newState: boolean) => {
    if (onOpenChange) {
      onOpenChange(newState);
    } else {
      setInternalOpen(newState);
    }
  };

  const toggleDropdown = () => {
    if (disabled) return;
    setDropdownState(!dropdownIsOpen);
  };

  // Set mounted state for SSR safety (needed for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate dropdown position using the placement hook
  const dropdownPosition = useDropdownPlacement({
    isOpen: dropdownIsOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    contentRef: dropdownContentRef as React.RefObject<HTMLElement>,
    placement,
  });

  const isDropdownSelectorObject = (
    selector: IDropdownProps["dropdownSelector"]
  ): selector is { content: ReactNode; variant: IButtonProps["variant"] } => {
    return (
      selector !== null &&
      typeof selector === "object" &&
      !Array.isArray(selector) &&
      "content" in selector
    );
  };

  const DropdownSelector = (
    <div ref={triggerRef}>
      {dropdownSelector ? (
        (() => {
          const isObject = isDropdownSelectorObject(dropdownSelector);
          const buttonContent = isObject
            ? dropdownSelector.content
            : dropdownSelector;
          const variant = isObject ? dropdownSelector.variant : undefined;

          return (
            <Button
              size={size}
              clicked={toggleDropdown}
              disabled={disabled}
              variant={variant}
              className={cn(
                "w-full py-2 h-9",
                "focus:ring-2 focus:ring-primary",
                dropdownIsOpen && "ring-2 ring-primary"
              )}>
              {buttonContent}
            </Button>
          );
        })()
      ) : (
        <IconButton
          size={size}
          clicked={toggleDropdown}
          disabled={disabled}>
          <HiDotsVertical className={dropdownSizeClasses[size].iconClasses} />
        </IconButton>
      )}
    </div>
  );

  const expandedContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!triggerRef.current) return;

      const target = event.target as Node;

      // Close dropdown only if click is outside the dropdown content, expanded content, and trigger
      const isClickInTrigger = triggerRef.current.contains(target);
      const isClickInDropdown =
        dropdownContentRef.current?.contains(target) ?? false;
      const isClickInExpanded =
        expandedContentRef.current?.contains(target) ?? false;

      // Check if the click is on an input that's part of the trigger (for searchable selects)
      const isClickOnInput =
        (target as HTMLElement)?.tagName === "INPUT" &&
        triggerRef.current?.querySelector("input") === target;

      if (
        !isClickInTrigger &&
        !isClickInDropdown &&
        !isClickInExpanded &&
        !isClickOnInput
      ) {
        setDropdownState(false);
      }
    };

    if (dropdownIsOpen) {
      // Use a small delay to ensure dropdown item clicks are handled first
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [dropdownIsOpen]);

  return (
    <>
      <div
        className="relative"
        ref={dropdownRef}>
        {DropdownSelector}
      </div>

      {dropdownIsOpen &&
        (() => {
          // If inside a dialog, use dialog's z-index + 5, otherwise use 60
          const dropdownZIndex = dialogContext ? dialogContext.zIndex + 5 : 60;

          const dropdownContent = (
            <div
              className="fixed flex shadow-lg rounded-2xl"
              style={{
                zIndex: dropdownZIndex,
                visibility: dropdownPosition ? "visible" : "hidden",
                top: dropdownPosition ? `${dropdownPosition.top}px` : "-9999px",
                left: dropdownPosition
                  ? `${dropdownPosition.left}px`
                  : "-9999px",
              }}>
              <div
                ref={dropdownContentRef}
                className={cn(
                  "bg-surface border border-border overflow-y-auto text-base font-normal",
                  showExpanded ? "rounded-l-2xl" : "rounded-2xl"
                )}
                style={{
                  // Only set width if specified (when content fits within trigger width)
                  // Otherwise let content determine width naturally
                  ...(dropdownPosition?.width
                    ? { width: `${dropdownPosition.width}px` }
                    : {}),
                  maxHeight: dropdownPosition
                    ? `${dropdownPosition.maxHeight}px`
                    : "none",
                }}
                onClick={() => {
                  if (closeOnItemClick) {
                    setDropdownState(false);
                  }
                }}>
                {children}
              </div>
              {showExpanded && expandedContent && (
                <div
                  ref={expandedContentRef}
                  className="bg-surface border-t overflow-hidden border-r border-b border-l-0 border-border rounded-r-2xl">
                  {expandedContent}
                </div>
              )}
            </div>
          );

          // Always render via portal to avoid clipping from parent containers
          if (isMounted && typeof window !== "undefined") {
            return createPortal(dropdownContent, document.body);
          }

          return dropdownContent;
        })()}
    </>
  );
}
