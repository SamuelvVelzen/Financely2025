import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  Children,
  PropsWithChildren,
  ReactNode,
  isValidElement,
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

type IDropdownFooterProps = {} & PropsWithChildren & IPropsWithClassName;

function DropdownFooter({ children, className = "" }: IDropdownFooterProps) {
  return (
    <div className={cn("flex gap-2 pt-2 border-t border-border", className)}>
      {children}
    </div>
  );
}

DropdownFooter.displayName = "DropdownFooter";

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
  /** Custom className for the selector button */
  selectorClassName?: string;
  /** If true, this dropdown won't close other dropdowns when opened. Useful for nested dropdowns. */
  allowNested?: boolean;
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
  selectorClassName,
  allowNested = false,
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

  // Generate a unique ID for this dropdown to track nesting
  const dropdownIdRef = useRef(`dropdown-${Math.random().toString(36).substr(2, 9)}`);

  const DropdownSelector = (
    <div
      ref={triggerRef}
      data-dropdown-trigger
      data-dropdown-id={dropdownIdRef.current}
      data-allow-nested={allowNested ? "true" : undefined}>
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
                "w-full",
                // Remove fixed height and padding when content is a div (Select component)
                // Use min-h-9 to allow growth when chips wrap, box-border to include border in height calculation
                !isObject && "min-h-9 box-border",
                isObject && "py-2 h-9",
                "focus:ring-2 focus:ring-primary",
                dropdownIsOpen && "ring-2 ring-primary",
                // Override Button's centering for Select components
                !isObject && "justify-start",
                selectorClassName
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

      // Check if click is on another dropdown's trigger
      const allDropdownTriggers = Array.from(
        document.querySelectorAll('[data-dropdown-trigger]')
      );
      const clickedDropdownTrigger = allDropdownTriggers.find((trigger) => {
        return trigger !== triggerRef.current && trigger.contains(target);
      });

      // If clicking on another dropdown trigger
      if (clickedDropdownTrigger) {
        // Check if the clicked dropdown is nested inside this dropdown's content
        // First try checking if the trigger is inside the content (works for portaled content)
        let isClickedNestedInThis =
          dropdownContentRef.current?.contains(clickedDropdownTrigger) ?? false;
        
        // If that didn't work (content is portaled), check if the clicked trigger
        // is inside an element with data-dropdown-content that matches this dropdown's ID
        if (!isClickedNestedInThis && dropdownContentRef.current) {
          const clickedDropdownId = clickedDropdownTrigger.getAttribute("data-dropdown-id");
          const thisDropdownId = dropdownIdRef.current;
          
          // Check if clicked trigger is inside any element with this dropdown's content ID
          const parentContent = clickedDropdownTrigger.closest(
            `[data-dropdown-content][data-dropdown-id="${thisDropdownId}"]`
          );
          isClickedNestedInThis = !!parentContent;
        }
        
        // If this dropdown allows nesting and the clicked dropdown is nested inside it,
        // don't close this dropdown (it's a parent allowing nested children)
        // Otherwise, close this dropdown when opening another
        if (allowNested && isClickedNestedInThis) {
          // Don't close - this is a parent dropdown and the clicked dropdown is nested inside it
          return;
        } else {
          // Close this dropdown - either it's a sibling or we're opening a parent
          setDropdownState(false);
          return;
        }
      }

      // Standard outside click handling
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

  // Separate Footer children from regular children
  const childrenArray = Children.toArray(children);
  const footerChildren: React.ReactNode[] = [];
  const regularChildren: React.ReactNode[] = [];

  childrenArray.forEach((child) => {
    if (
      isValidElement(child) &&
      (child.type === DropdownFooter ||
        (child.type as any)?.displayName === "DropdownFooter")
    ) {
      footerChildren.push(child);
    } else {
      regularChildren.push(child);
    }
  });

  return (
    <>
      <div
        className="relative"
        ref={dropdownRef}
        data-dropdown-container>
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
                data-dropdown-content
                data-dropdown-id={dropdownIdRef.current}
                className={cn(
                  "bg-surface border border-border text-base font-normal flex flex-col overflow-hidden",
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (closeOnItemClick) {
                    setDropdownState(false);
                  }
                }}>
                <div className="overflow-y-auto flex-1">{regularChildren}</div>
                {footerChildren.length > 0 && (
                  <div className="shrink-0">{footerChildren}</div>
                )}
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

Dropdown.Footer = DropdownFooter;
