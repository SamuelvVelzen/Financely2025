"use client";

import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { HiX } from "react-icons/hi";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { TextInput } from "./text-input";

export type ISearchInputProps = IPropsWithClassName & {
  name: string;
  placeholder?: string;
  label?: string;
};

export function SearchInput({
  className = "",
  name,
  placeholder = "Search by name, tag, description...",
  label,
}: ISearchInputProps) {
  const form = useFormContext();
  const value = form.watch(name) || "";
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClear = () => {
    form.setValue(name, "");
  };

  // Expand if there's text
  useEffect(() => {
    if (value) {
      setIsExpanded(true);
    }
  }, [value]);

  // Handle click outside to collapse if no text
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !value
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isExpanded, value]);

  const handleIconClick = () => {
    setIsExpanded(true);
  };

  const shouldExpand = isExpanded || isHovered || !!value;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative transition-all duration-300 ease-in-out focus-within:w-[300px]",
        shouldExpand ? "w-[300px]" : "w-10",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {shouldExpand ? (
        <TextInput
          name={name}
          label={label}
          placeholder={placeholder}
          className="truncate"
          prefixIcon={<HiMagnifyingGlass className="w-5 h-5" />}
          suffixIcon={
            value ? (
              <IconButton
                clicked={handleClear}
                aria-label="Clear search"
                className="p-0">
                <HiX className="w-5 h-5" />
              </IconButton>
            ) : undefined
          }
        />
      ) : (
        <IconButton
          clicked={handleIconClick}
          className="w-10 h-10 my-0"
          aria-label="Search">
          <HiMagnifyingGlass className="w-5 h-5" />
        </IconButton>
      )}
    </div>
  );
}
