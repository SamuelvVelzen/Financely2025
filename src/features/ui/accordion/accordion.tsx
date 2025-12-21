"use client";

import { cn } from "@/features/util/cn";
import { type ReactNode, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";

interface IAccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function Accordion({
  title,
  defaultOpen = true,
  children,
  className,
}: IAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 text-left cursor-pointer group">
        <span className="text-text-muted tracking-wide font-medium group-hover:text-text transition-colors">
          {title}
        </span>
        <HiChevronDown
          className={cn(
            "w-4 h-4 text-text-muted transition-transform group-hover:text-text",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}>
        <div className="overflow-hidden">
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </div>
  );
}
