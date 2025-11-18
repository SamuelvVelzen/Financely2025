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
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
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

  // Calculate dropdown position when opening
  useEffect(() => {
    if (dropdownIsOpen && triggerRef.current) {
      const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      };

      updatePosition();

      // Update position on scroll
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
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
      if (!dropdownRef.current || !triggerRef.current) return;

      const target = event.target as Node;

      // Close dropdown only if click is outside the dropdown container and trigger
      if (
        !dropdownRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        setDropdownState(false);
      }
    };

    if (dropdownIsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
          className="fixed bg-surface border border-border overflow-scroll rounded-2xl text-base font-normal z-50 min-w-min"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}>
          {children}
        </div>
      )}
    </>
  );
}
