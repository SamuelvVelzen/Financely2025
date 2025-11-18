"use client";

import {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { HiDotsVertical } from "react-icons/hi";
import { Button } from "../button/button";

type IDropdownProps = {
  dropdownSelector?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} & PropsWithChildren;

export function Dropdown({
  children,
  dropdownSelector,
  open: controlledOpen,
  onOpenChange,
}: IDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    placement: "bottom" | "top" | "bottom-right" | "top-right";
  } | null>(null);
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
    setDropdownState(!dropdownIsOpen);
  };

  // Calculate dropdown position when opening with smart placement
  useEffect(() => {
    if (dropdownIsOpen && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const spacing = 4; // 4px spacing from trigger

        // Estimate dropdown size (will be measured after render)
        const estimatedDropdownHeight = 200; // Conservative estimate
        const estimatedDropdownWidth = Math.max(rect.width, 200);

        // Calculate preferred position (below, aligned left)
        let top = rect.bottom + spacing;
        let left = rect.left;
        let placement: "bottom" | "top" | "bottom-right" | "top-right" =
          "bottom";

        // Check if dropdown would go off bottom of screen
        if (top + estimatedDropdownHeight > viewportHeight) {
          // Try placing above
          const spaceAbove = rect.top;
          if (spaceAbove > estimatedDropdownHeight) {
            top = rect.top - estimatedDropdownHeight - spacing;
            placement = "top";
          } else {
            // Not enough space above, keep below but adjust
            top = Math.max(
              spacing,
              viewportHeight - estimatedDropdownHeight - spacing
            );
          }
        }

        // Check if dropdown would go off right edge
        if (left + estimatedDropdownWidth > viewportWidth) {
          // Align to right edge of trigger
          left = rect.right - estimatedDropdownWidth;
          placement = placement === "top" ? "top-right" : "bottom-right";

          // If still off screen, align to viewport right
          if (left < spacing) {
            left = viewportWidth - estimatedDropdownWidth - spacing;
          }
        }

        // Ensure dropdown doesn't go off left edge
        if (left < spacing) {
          left = spacing;
        }

        const maxHeight =
          placement === "top" ? top - 8 : window.innerHeight - top - 8;

        setDropdownPosition({
          top,
          left,
          width: rect.width,
          maxHeight,
          placement,
        });
      };

      // Initial position calculation
      updatePosition();

      // Fine-tune position after dropdown is rendered and measured
      const fineTunePosition = () => {
        if (!dropdownContentRef.current || !triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownRect = dropdownContentRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const spacing = 4;

        let top = rect.bottom + spacing;
        let left = rect.left;
        let placement: "bottom" | "top" | "bottom-right" | "top-right" =
          "bottom";

        // Check if dropdown would go off bottom of screen
        if (top + dropdownRect.height > viewportHeight) {
          const spaceAbove = rect.top;
          if (spaceAbove > dropdownRect.height) {
            top = rect.top - dropdownRect.height - spacing;
            placement = "top";
          } else {
            top = Math.max(
              spacing,
              viewportHeight - dropdownRect.height - spacing
            );
          }
        }

        // Check if dropdown would go off right edge
        if (left + dropdownRect.width > viewportWidth) {
          left = rect.right - dropdownRect.width;
          placement = placement === "top" ? "top-right" : "bottom-right";
          if (left < spacing) {
            left = viewportWidth - dropdownRect.width - spacing;
          }
        }

        if (left < spacing) {
          left = spacing;
        }

        const maxHeight =
          placement === "top" ? top - 8 : window.innerHeight - top - 8;

        setDropdownPosition({
          top,
          left,
          width: rect.width,
          maxHeight,
          placement,
        });
      };

      // Fine-tune after a short delay to allow rendering
      const timeoutId = setTimeout(fineTunePosition, 10);

      // Update position on scroll and resize
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [dropdownIsOpen]);

  const DropdownSelector = dropdownSelector ? (
    <div
      ref={triggerRef}
      onClick={toggleDropdown}>
      {dropdownSelector}
    </div>
  ) : (
    <div ref={triggerRef}>
      <Button
        className="text-xl"
        clicked={toggleDropdown}>
        <HiDotsVertical />
      </Button>
    </div>
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!triggerRef.current) return;

      const target = event.target as Node;

      // Close dropdown only if click is outside the dropdown content and trigger
      const isClickInTrigger = triggerRef.current.contains(target);
      const isClickInDropdown =
        dropdownContentRef.current?.contains(target) ?? false;

      if (!isClickInTrigger && !isClickInDropdown) {
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

      {dropdownIsOpen && dropdownPosition && (
        <div
          ref={dropdownContentRef}
          className="fixed bg-surface border border-border overflow-scroll rounded-2xl text-base font-normal z-20 min-w-min shadow-lg"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: `${dropdownPosition.maxHeight}px`,
          }}>
          {children}
        </div>
      )}
    </>
  );
}
