"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import { useState } from "react";
import { HiChevronDown, HiX } from "react-icons/hi";
import { Checkbox } from "../checkbox/checkbox";
import { Dropdown } from "../dropdown/dropdown";
import { DropdownItem } from "../dropdown/dropdown-item";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectDropdownProps = PropsWithClassName & {
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[] | undefined) => void;
  multiple?: boolean;
  placeholder?: string;
};

export function SelectDropdown({
  className = "",
  options,
  value,
  onChange,
  multiple = false,
  placeholder = "Select...",
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get selected labels for display
  const getDisplayText = (): string => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return placeholder;
    }

    if (multiple && Array.isArray(value)) {
      const selectedOptions = options.filter((opt) =>
        value.includes(opt.value)
      );
      return selectedOptions.map((opt) => opt.label).join(", ");
    }

    if (!multiple && typeof value === "string") {
      const selectedOption = options.find((opt) => opt.value === value);
      return selectedOption?.label || placeholder;
    }

    return placeholder;
  };

  // Check if option is selected
  const isSelected = (optionValue: string): boolean => {
    if (!value) return false;

    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }

    if (!multiple && typeof value === "string") {
      return value === optionValue;
    }

    return false;
  };

  // Handle option selection
  const handleOptionClick = (optionValue: string) => {
    if (multiple) {
      // Multiple select: toggle the option
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter((v) => v !== optionValue)
        : [...currentValues, optionValue];
      onChange?.(newValues);
    } else {
      // Single select: toggle selection (allow deselecting)
      if (value === optionValue) {
        // Deselect if already selected
        onChange?.(undefined);
      } else {
        // Select the option
        onChange?.(optionValue);
      }
      // Close dropdown after single selection
      setIsOpen(false);
    }
  };

  // Handle clear button click
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dropdown from opening
    if (multiple) {
      onChange?.([]);
    } else {
      onChange?.(undefined);
    }
  };

  const displayText = getDisplayText();
  const hasSelection =
    value && (Array.isArray(value) ? value.length > 0 : value !== "");

  // Custom selector button
  const selectorButton = (
    <button
      type="button"
      className={cn(
        "w-full px-4 py-2 border border-border rounded-lg bg-surface hover:bg-surface-hover",
        "flex items-center justify-between text-base",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        !hasSelection && "text-text-muted",
        hasSelection && "text-text"
      )}>
      <span className="flex-1 text-left">{displayText}</span>
      <div className="flex items-center gap-1 ml-2">
        {hasSelection && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text",
              "flex items-center justify-center"
            )}
            aria-label="Clear selection">
            <HiX className="w-4 h-4" />
          </button>
        )}

        <HiChevronDown
          className={cn(
            "w-4 h-4 text-text-muted transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </div>
    </button>
  );

  return (
    <div className={cn("relative", className)}>
      <Dropdown
        dropdownSelector={selectorButton}
        open={isOpen}
        onOpenChange={setIsOpen}>
        {options.map((option) => (
          <DropdownItem
            key={option.value}
            clicked={() => handleOptionClick(option.value)}>
            <div className="flex items-center gap-2 w-full">
              <Checkbox
                checked={isSelected(option.value)}
                onChange={() => handleOptionClick(option.value)}
                className="pointer-events-none"
              />
              <span className="flex-1">{option.label}</span>
            </div>
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  );
}
