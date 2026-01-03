"use client";

import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { useEffect, useState } from "react";
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

  return (
    <div
      data-collapsed={isCollapsed}
      data-empty={isEmpty}
      data-open={isOpen}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative transition-all duration-300 ease-in-out",
        "w-9 hover:w-[300px] focus-within:w-[300px]",
        "has-[input:not(:placeholder-shown)]:w-[300px]",
        "data-[open=true]:w-[300px]",
        "data-[collapsed=true]:[&_input]:pr-2!",
        "data-[collapsed=true]:[&_input]:pl-2!",
        "data-[open=true]:[&_input]:pl-9!",
        "data-[open=true]:[&_input]:pr-9!",
        "focus-within:[&_input]:pl-9!",
        "focus-within:[&_input]:pr-9!",
        "data-[collapsed=true]:[&>div>div>div:last-child]:hidden",
        "focus-within:[&>div>div>div:last-child]:flex!",
        "[&_input::placeholder]:opacity-0",
        "hover:[&_input::placeholder]:opacity-100",
        "focus-within:[&_input::placeholder]:opacity-100",
        "has-[input:not(:placeholder-shown)]:[&_input::placeholder]:opacity-100",
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
  );
}
