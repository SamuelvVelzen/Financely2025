"use client";

import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
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

  const handleClear = () => {
    form.setValue(name, "");
  };

  return (
    <div className={cn(className)}>
      <TextInput
        name={name}
        label={label}
        placeholder={placeholder}
        prefixIcon={<HiMagnifyingGlass className="w-4 h-4" />}
        suffixIcon={
          value ? (
            <IconButton
              clicked={handleClear}
              className="text-text-muted hover:text-text p-1"
              aria-label="Clear search">
              <HiX className="w-4 h-4" />
            </IconButton>
          ) : undefined
        }
      />
    </div>
  );
}
