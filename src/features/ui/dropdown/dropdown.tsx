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

type IDropdownProps = { dropdownSelector?: ReactNode } & PropsWithChildren;

export function Dropdown({ children, dropdownSelector }: IDropdownProps) {
  const [dropdownIsOpen, setDropdownState] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selector = dropdownSelector ? dropdownSelector : <HiDotsVertical />;

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
      <Button
        className="text-xl"
        clicked={() => setDropdownState((oldState) => !oldState)}>
        {selector}
      </Button>

      {dropdownIsOpen && (
        <div className="absolute top-full right-0 bg-surface border border-border overflow-scroll rounded-2xl divide-y divide-border text-base font-normal">
          {children}
        </div>
      )}
    </div>
  );
}
