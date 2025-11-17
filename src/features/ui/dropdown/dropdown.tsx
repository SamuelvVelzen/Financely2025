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
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const DropdownSelector = dropdownSelector ? (
    <div onClick={toggleDropdown}>{dropdownSelector}</div>
  ) : (
    <Button
      className="text-xl"
      clicked={toggleDropdown}>
      <HiDotsVertical />
    </Button>
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current) return;

      const target = event.target as Node;

      // Close dropdown only if click is outside the dropdown container
      // Clicks inside dropdown items are handled by their own onClick handlers
      if (!dropdownRef.current.contains(target)) {
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
    <div
      className="relative"
      ref={dropdownRef}>
      {DropdownSelector}

      {dropdownIsOpen && (
        <div className="absolute w-full min-w-min top-full right-0 bg-surface border border-border overflow-scroll rounded-2xl divide-y divide-border text-base font-normal z-10">
          {children}
        </div>
      )}
    </div>
  );
}
