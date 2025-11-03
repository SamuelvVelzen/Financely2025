"use client";

import { PropsWithChildren, ReactNode, useEffect, useState } from "react";
import { HiDotsVertical } from "react-icons/hi";
import { Button } from "../button/button";

type IDropdownProps = { dropdownSelector?: ReactNode } & PropsWithChildren;

export function Dropdown({ children, dropdownSelector }: IDropdownProps) {
  const [dropdownIsOpen, setDropdownState] = useState(false);

  const selector = dropdownSelector ? dropdownSelector : <HiDotsVertical />;

  useEffect(() => {}, []);

  return (
    <div className="relative">
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
