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

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const handleClear = () => {
    form.setValue(name, "");
  };

  const isEmpty = !value;
  const isOpen = !isEmpty || isHovered;

  useEffect(() => {
    setIsCollapsed(isEmpty && !isHovered);
  }, [isEmpty, isHovered]);

  const measureRef = useRef<HTMLSpanElement>(null);

  const [expandedWidth, setExpandedWidth] = useState(300);

  useEffect(() => {
    if (measureRef.current) {
      // Measure the placeholder text width
      const width = measureRef.current.offsetWidth;
      // Add padding for icons (pl-9 + pr-9 = 72px) + some extra buffer
      setExpandedWidth(Math.max(300, width + 80));
    }
  }, [placeholder]);

  return (
    <>
      <span
        ref={measureRef}
        className="absolute invisible whitespace-nowrap text-base"
        style={{ font: "inherit" }}>
        {placeholder}
      </span>
      <div
        data-collapsed={isCollapsed}
        data-empty={isEmpty}
        data-open={isOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={
          {
            "--expanded-width": `${expandedWidth}px`,
          } as React.CSSProperties
        }
        className={cn(
          "relative transition-all ease-in-out",
          "w-28 hover:w-(--expanded-width) focus-within:w-(--expanded-width)",
          "has-[input:not(:placeholder-shown)]:w-(--expanded-width)",
          "data-[open=true]:w-(--expanded-width)",
          "data-[collapsed=true]:[&_input]:pr-2!",
          "data-[open=true]:[&_input]:pl-9!",
          "data-[open=true]:[&_input]:pr-9!",
          "focus-within:[&_input]:pl-9!",
          "focus-within:[&_input]:pr-9!",
          "data-[collapsed=true]:[&>div>div>div:last-child]:hidden",
          className
        )}>
        <TextInput
          name={name}
          label={label}
          placeholder={placeholder}
          className="truncate"
          prefixIcon={<HiMagnifyingGlass className="size-5" />}
          suffixIcon={
            <IconButton
              clicked={handleClear}
              aria-label="Clear search"
              className="p-0">
              <HiX className="size-5" />
            </IconButton>
          }
        />
      </div>
    </>
  );
}
