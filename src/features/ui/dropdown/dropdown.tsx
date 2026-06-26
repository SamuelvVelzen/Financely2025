import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  Children,
  type PropsWithChildren,
  type ReactNode,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { HiDotsVertical } from "react-icons/hi";
import { Button, type IButtonProps, type IButtonSize } from "../button/button";
import { IconButton } from "../button/icon-button";
import {
  dropdownFooterBorderClasses,
  dropdownPanelContentClasses,
  dropdownPanelFooterBorderClasses,
} from "./dropdown-item-classes";

export type IPlacementOption = "top" | "bottom" | "left" | "right" | "auto";

const dropdownSizeClasses: { [key in IButtonSize]: { iconClasses: string } } = {
  xs: { iconClasses: "size-3" },
  sm: { iconClasses: "size-4" },
  md: { iconClasses: "size-5" },
  lg: { iconClasses: "size-6" },
};

type IDropdownFooterProps = {} & PropsWithChildren & IPropsWithClassName;

function DropdownFooter({ children, className = "" }: IDropdownFooterProps) {
  return (
    <div
      className={cn(
        "flex gap-2",
        dropdownPanelFooterBorderClasses,
        dropdownFooterBorderClasses,
        className
      )}>
      {children}
    </div>
  );
}

DropdownFooter.displayName = "DropdownFooter";

type IDropdownPanelProps = {} & PropsWithChildren & IPropsWithClassName;

function DropdownPanel({ children, className = "" }: IDropdownPanelProps) {
  return (
    <div className={cn(dropdownPanelContentClasses, className)}>{children}</div>
  );
}

DropdownPanel.displayName = "DropdownPanel";

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
  /** Optional className for the dropdown panel shell */
  panelClassName?: string;
} & PropsWithChildren;

/**
 * Dropdown component using native Popover API and CSS Anchor Positioning
 *
 * Features:
 * - Native popover with automatic top-layer rendering
 * - CSS anchor positioning for smart placement
 * - Built-in light-dismiss behavior
 * - Automatic flip fallbacks when near viewport edges
 */
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
  allowNested: _allowNested = false,
  panelClassName,
}: IDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const expandedContentRef = useRef<HTMLDivElement>(null);

  // Generate unique IDs for anchor positioning
  const uniqueId = useId();
  const anchorName = `--dropdown-anchor-${uniqueId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const popoverId = `dropdown-popover-${uniqueId.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Use controlled state if provided, otherwise use internal state
  const dropdownIsOpen =
    controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setDropdownState = useCallback(
    (newState: boolean) => {
      if (onOpenChange) {
        onOpenChange(newState);
      } else {
        setInternalOpen(newState);
      }
    },
    [onOpenChange]
  );

  const toggleDropdown = useCallback(() => {
    if (disabled) return;
    setDropdownState(!dropdownIsOpen);
  }, [disabled, dropdownIsOpen, setDropdownState]);

  // Sync popover state with controlled open state
  useEffect(() => {
    const popover = dropdownContentRef.current;
    if (!popover) return;

    if (dropdownIsOpen && !popover.matches(":popover-open")) {
      popover.showPopover();
    } else if (!dropdownIsOpen && popover.matches(":popover-open")) {
      popover.hidePopover();
    }
  }, [dropdownIsOpen]);

  // Handle native popover toggle event
  const handleToggle = useCallback(
    (event: React.ToggleEvent<HTMLDivElement>) => {
      const newState = event.newState === "open";
      if (newState !== dropdownIsOpen) {
        setDropdownState(newState);
      }
    },
    [dropdownIsOpen, setDropdownState]
  );

  // Determine CSS position classes based on placement prop
  const getPositionClasses = () => {
    const placementValue = Array.isArray(placement) ? placement[0] : placement;

    // Default positioning: below trigger, left-aligned
    // CSS anchor positioning handles the actual placement
    switch (placementValue) {
      case "top":
        return "dropdown-position-top";
      case "left":
        return "dropdown-position-left";
      case "right":
        return "dropdown-position-right";
      case "bottom":
      case "auto":
      default:
        return "dropdown-position-bottom";
    }
  };

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
    <div
      ref={triggerRef}
      data-dropdown-trigger
      style={{ anchorName } as React.CSSProperties}>
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
                // Select-style triggers (raw ReactNode): min height for chips/wrapping
                !isObject && "min-h-9 box-border",
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

  // Separate Footer children from regular children
  const childrenArray = Children.toArray(children);
  const footerChildren: React.ReactNode[] = [];
  const regularChildren: React.ReactNode[] = [];

  childrenArray.forEach((child) => {
    if (
      isValidElement(child) &&
      (child.type === DropdownFooter ||
        (child.type as { displayName?: string })?.displayName === "DropdownFooter")
    ) {
      footerChildren.push(child);
    } else {
      regularChildren.push(child);
    }
  });

  const hasPanelContent = regularChildren.some(
    (child) =>
      isValidElement(child) &&
      (child.type === DropdownPanel ||
        (child.type as { displayName?: string })?.displayName ===
          "DropdownPanel")
  );

  return (
    <>
      <div
        className="relative"
        ref={dropdownRef}
        data-dropdown-container>
        {DropdownSelector}
      </div>

      <div
        ref={dropdownContentRef}
        id={popoverId}
        popover="auto"
        data-dropdown-content
        className={cn(
          "dropdown-popover",
          getPositionClasses(),
          showExpanded && "dropdown-anchor-end",
          "flex flex-row shadow-lg rounded-2xl",
          // Reset default popover styles
          "m-0 p-0 border-0 bg-transparent",
          // Ensure closed popovers stay hidden (flex overrides browser default)
          "not-[:popover-open]:hidden"
        )}
        style={
          {
            positionAnchor: anchorName,
          } as React.CSSProperties
        }
        onToggle={handleToggle}
        role="presentation"
        onClick={(e) => {
          e.stopPropagation();
          if (
            closeOnItemClick &&
            (e.target as HTMLElement).closest("[data-dropdown-item]")
          ) {
            setDropdownState(false);
          }
        }}
        onKeyDown={(e) => {
          if (
            closeOnItemClick &&
            (e.key === "Enter" || e.key === " ") &&
            (e.target as HTMLElement).closest("[data-dropdown-item]")
          ) {
            e.stopPropagation();
            setDropdownState(false);
          }
        }}>
        <div
          data-dropdown-panel
          data-panel-mode={hasPanelContent ? "content" : "items"}
          data-expanded={showExpanded ? "true" : undefined}
          className={cn(
            "group/dropdown-panel text-base font-normal flex flex-col",
            showExpanded ? "shrink-0" : "w-full min-w-full",
            panelClassName,
            "max-h-[calc(100vh-16px)]",
            hasPanelContent &&
              (showExpanded
                ? "border border-border overflow-hidden bg-surface rounded-l-2xl"
                : "border border-border overflow-hidden bg-surface rounded-2xl"),
            !hasPanelContent && "bg-surface"
          )}>
          <div
            data-dropdown-list
            data-expanded={showExpanded ? "true" : undefined}
            className="group/dropdown-list overflow-y-auto flex-1 min-h-0">
            {regularChildren}
          </div>
          {footerChildren.length > 0 && (
            <div
              className="shrink-0"
              data-dropdown-footer>
              {footerChildren}
            </div>
          )}
        </div>
        {showExpanded && expandedContent && (
          <div
            ref={expandedContentRef}
            className="shrink-0 bg-surface border overflow-hidden border-border rounded-r-2xl rounded-l-none -ml-px">
            {expandedContent}
          </div>
        )}
      </div>
    </>
  );
}

Dropdown.Footer = DropdownFooter;
Dropdown.Panel = DropdownPanel;
