"use client";

import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { HiX } from "react-icons/hi";
import { HiMagnifyingGlass } from "react-icons/hi2";

export type ISearchInputProps = IPropsWithClassName & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  className = "",
  value,
  onChange,
  placeholder = "Search by name, tag, description...",
}: ISearchInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange("");
  };

  // Use same base classes as Input component
  const baseClasses =
    "w-full border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const borderClass = "border-border";
  const paddingClasses = "pl-10 pr-10 py-2";

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
        <HiMagnifyingGlass className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(baseClasses, borderClass, paddingClasses)}
      />
      {value && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <IconButton
            clicked={handleClear}
            className="text-text-muted hover:text-text p-1"
            aria-label="Clear search">
            <HiX className="w-4 h-4" />
          </IconButton>
        </div>
      )}
    </div>
  );
}
