"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";

type IDragHandleProps = IPropsWithClassName;

export function DragHandle({ className = "" }: IDragHandleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center cursor-grab active:cursor-grabbing text-text-muted hover:text-text transition-colors",
        className
      )}
      draggable={false}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5"
      >
        {/* Left column: 3 dots */}
        <circle cx="7" cy="5" r="1.5" fill="currentColor" />
        <circle cx="7" cy="10" r="1.5" fill="currentColor" />
        <circle cx="7" cy="15" r="1.5" fill="currentColor" />
        {/* Right column: 3 dots */}
        <circle cx="13" cy="5" r="1.5" fill="currentColor" />
        <circle cx="13" cy="10" r="1.5" fill="currentColor" />
        <circle cx="13" cy="15" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
}
