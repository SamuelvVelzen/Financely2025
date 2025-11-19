"use client";

import { cn } from "@/util/cn";
import {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { HiDotsVertical } from "react-icons/hi";
import { Button } from "../button/button";
import { useDropdownPlacement } from "./hooks/use-dropdown-placement";

type IDropdownProps = {
  dropdownSelector?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  expandedContent?: ReactNode;
  showExpanded?: boolean;
} & PropsWithChildren;

export function Dropdown({
  children,
  dropdownSelector,
  open: controlledOpen,
  onOpenChange,
  expandedContent,
  showExpanded = false,
}: IDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
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

  // Calculate dropdown position using the placement hook
  const dropdownPosition = useDropdownPlacement({
    isOpen: dropdownIsOpen,
    triggerRef: triggerRef as React.RefObject<HTMLElement>,
    contentRef: dropdownContentRef as React.RefObject<HTMLElement>,
  });

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

      if (!isClickInTrigger && !isClickInDropdown && !isClickInExpanded) {
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
        <div className="fixed z-20 flex">
          <div
            ref={dropdownContentRef}
            className={cn(
              "bg-surface border border-border overflow-scroll text-base font-normal min-w-min shadow-lg",
              showExpanded ? "rounded-l-2xl" : "rounded-2xl"
            )}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              maxHeight: `${dropdownPosition.maxHeight}px`,
            }}>
            {children}
          </div>
          {showExpanded && expandedContent && (
            <div
              ref={expandedContentRef}
              className="bg-surface border-t border-r border-b border-l-0 border-border overflow-hidden rounded-r-2xl shadow-lg">
              {expandedContent}
            </div>
          )}
        </div>
      )}
    </>
  );
}
