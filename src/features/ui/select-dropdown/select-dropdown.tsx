"use client";

import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { ReactNode, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { HiChevronDown, HiX } from "react-icons/hi";
import { Checkbox } from "../checkbox/checkbox";
import { Dropdown } from "../dropdown/dropdown";
import { DropdownItem } from "../dropdown/dropdown-item";
import { NativeSelect } from "../select/native-select";
import { Label } from "../typography/label";

export type ISelectOption<TData = unknown> = {
  value: string;
  label: string;
  data?: TData;
};

// Helper type to extract data type from options array
type ExtractDataFromOptions<
  TOptions extends ISelectOption<any>[] | readonly ISelectOption<any>[],
> = TOptions[number] extends ISelectOption<infer TData> ? TData : unknown;

export type ISelectDropdownProps<
  TOptions extends
    | ISelectOption<any>[]
    | readonly ISelectOption<any>[] = ISelectOption[],
  TData = ExtractDataFromOptions<TOptions>,
> = IPropsWithClassName & {
  name: string;
  options: TOptions;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  maxDisplayItems?: number;
  showClearButton?: boolean;
  children?: (
    option: ISelectOption<TData>,
    index: number,
    context: {
      isSelected: boolean;
      handleClick: () => void;
      multiple: boolean;
    }
  ) => ReactNode;
};

export function SelectDropdown<
  TOptions extends
    | ISelectOption<any>[]
    | readonly ISelectOption<any>[] = ISelectOption[],
  TData = ExtractDataFromOptions<TOptions>,
>({
  className = "",
  name,
  options,
  multiple = false,
  placeholder = "Select...",
  label,
  maxDisplayItems = 2,
  showClearButton = true,
  children,
}: ISelectDropdownProps<TOptions, TData>) {
  const { isMobile } = useResponsive();
  const form = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const error = form.formState.errors[name];

  // On mobile, use native select
  if (isMobile) {
    return (
      <NativeSelect
        className={className}
        name={name}
        options={options}
        multiple={multiple}
        placeholder={placeholder}
        label={label}
      />
    );
  }

  // Get selected labels for display
  const getDisplayText = (value: string | string[] | undefined): string => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return placeholder;
    }

    if (multiple && Array.isArray(value)) {
      const selectedOptions = value
        .map((val) => options.find((opt) => opt.value === val))
        .filter((opt): opt is ISelectOption<TData> => opt !== undefined);

      if (selectedOptions.length <= maxDisplayItems) {
        return selectedOptions.map((opt) => opt.label).join(", ");
      } else {
        const displayedOptions = selectedOptions
          .slice(0, maxDisplayItems)
          .map((opt) => opt.label)
          .join(", ");
        const remainingCount = selectedOptions.length - maxDisplayItems;
        return `${displayedOptions} + ${remainingCount}`;
      }
    }

    if (!multiple && typeof value === "string") {
      const selectedOption = options.find((opt) => opt.value === value);
      return selectedOption?.label || placeholder;
    }

    return placeholder;
  };

  // Check if option is selected
  const isSelected = (
    optionValue: string,
    value: string | string[] | undefined
  ): boolean => {
    if (!value) return false;

    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }

    if (!multiple && typeof value === "string") {
      return value === optionValue;
    }

    return false;
  };

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => {
        const value = field.value;
        const displayText = getDisplayText(value);
        const hasSelection =
          value && (Array.isArray(value) ? value.length > 0 : value !== "");

        // Handle option selection
        const handleOptionClick = (optionValue: string) => {
          if (multiple) {
            // Multiple select: toggle the option
            const currentValues = Array.isArray(value) ? value : [];
            const newValues = currentValues.includes(optionValue)
              ? currentValues.filter((v) => v !== optionValue)
              : [...currentValues, optionValue];
            field.onChange(newValues);
          } else {
            // Single select: toggle selection (allow deselecting)
            if (value === optionValue) {
              // Deselect if already selected
              field.onChange(undefined);
            } else {
              // Select the option
              field.onChange(optionValue);
            }
            // Close dropdown after single selection
            setIsOpen(false);
          }
        };

        // Handle clear button click
        const handleClear = (e: React.MouseEvent) => {
          e.stopPropagation(); // Prevent dropdown from opening
          if (multiple) {
            field.onChange([]);
          } else {
            // Reset to default value so React Hook Form recognizes it as set
            form.resetField(name);
          }
        };

        // Custom selector button
        const selectorButton = (
          <>
            <span className="flex-1 text-left whitespace-nowrap truncate">
              {displayText}
            </span>
            <div className="flex items-center gap-1 ml-2">
              {hasSelection && showClearButton && (
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    "p-1 rounded text-text-muted hover:text-text cursor-pointer",
                    "flex items-center justify-center"
                  )}
                  aria-label="Clear selection"
                >
                  <HiX className="size-4" />
                </button>
              )}

              <HiChevronDown
                className={cn(
                  "size-5 transition-transform duration-200 text-text-muted hover:text-text",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </>
        );

        return (
          <div className={cn("relative", className)}>
            {label && <Label className="mb-1">{label}</Label>}
            <Dropdown
              dropdownSelector={selectorButton}
              open={isOpen}
              onOpenChange={setIsOpen}
              closeOnItemClick={!multiple}
            >
              {options.map((option, index) => {
                const optionIsSelected = isSelected(option.value, value);
                const handleClick = () => handleOptionClick(option.value);
                return (
                  <DropdownItem
                    key={option.value}
                    clicked={handleClick}
                    selected={optionIsSelected}
                  >
                    {
                      <div className="flex items-center gap-2 w-full">
                        {multiple && (
                          <Checkbox
                            checked={optionIsSelected}
                            onChange={handleClick}
                            className="pointer-events-none"
                          />
                        )}

                        {children ? (
                          children(option, index, {
                            isSelected: optionIsSelected,
                            handleClick,
                            multiple,
                          })
                        ) : (
                          <span>{option.label}</span>
                        )}
                      </div>
                    }
                  </DropdownItem>
                );
              })}
            </Dropdown>
            {error && (
              <p className="text-sm text-danger mt-1">
                {(error as { message?: string })?.message || String(error)}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
