"use client";

import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { HiChevronDown, HiInformationCircle, HiX } from "react-icons/hi";
import { Checkbox } from "../checkbox/checkbox";
import { Dropdown } from "../dropdown/dropdown";
import { DropdownItem } from "../dropdown/dropdown-item";
import { DropdownItemEmpty } from "../dropdown/dropdown-item-empty";
import type { IPlacementOption } from "../dropdown/hooks/use-dropdown-placement";
import { Label } from "../typography/label";
import { NativeSelect } from "./native-select";

export type ISelectOption<TData = unknown> = {
  value: string;
  label: string;
  data?: TData;
};

// Helper type to extract data type from options array
type ExtractDataFromOptions<
  TOptions extends ISelectOption<any>[] | readonly ISelectOption<any>[],
> = TOptions[number] extends ISelectOption<infer TData> ? TData : unknown;

export type ISelectProps<
  TOptions extends ISelectOption<any>[] | readonly ISelectOption<any>[] =
    ISelectOption[],
  TData = ExtractDataFromOptions<TOptions>,
> = IPropsWithClassName & {
  name: string;
  options: TOptions;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  hint?: string;
  children?: (
    option: ISelectOption<TData>,
    index: number,
    context: {
      isSelected: boolean;
      handleClick: () => void;
      multiple: boolean;
      searchQuery: string;
    }
  ) => ReactNode;
  onCreateNew?: (searchQuery: string) => void;
  createNewLabel?: string | ((searchQuery: string) => string);
  getOptionSearchValue?: (option: ISelectOption<TData>) => string;
  forcePlacement?: IPlacementOption[];
};

export function Select<
  TOptions extends ISelectOption<any>[] | readonly ISelectOption<any>[] =
    ISelectOption[],
  TData = ExtractDataFromOptions<TOptions>,
>({
  className = "",
  name,
  options,
  multiple = false,
  placeholder = "Select...",
  label,
  searchPlaceholder = "Type to search...",
  disabled = false,
  hint,
  children,
  onCreateNew,
  createNewLabel = "Create new",
  getOptionSearchValue,
  forcePlacement,
}: ISelectProps<TOptions, TData>) {
  const { isMobile } = useResponsive();
  const form = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const error = form.formState.errors[name];

  const { highlightText } = useHighlightText();

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
        disabled={disabled}
      />
    );
  }

  // Keep dropdown open when input is focused
  useEffect(() => {
    if (
      inputRef.current &&
      document.activeElement === inputRef.current &&
      !disabled
    ) {
      setIsOpen(true);
    }
  }, [searchQuery, disabled]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) {
      return options;
    }

    const query = searchQuery.toLowerCase();
    return options.filter((option) => {
      const searchValue = getOptionSearchValue
        ? getOptionSearchValue(option)
        : option.label;
      return searchValue.toLowerCase().includes(query);
    });
  }, [options, searchQuery, getOptionSearchValue]);

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

  // Get selected options
  const getSelectedOptions = (
    value: string | number | string[] | number[] | undefined
  ): ISelectOption<TData>[] => {
    console.log("value", value);
    if (!value) return [];
    if (multiple && Array.isArray(value)) {
      // Preserve the order from the value array (FIFO)
      return value
        .map((val) => options.find((opt) => opt.value === val))
        .filter((opt): opt is ISelectOption<TData> => opt !== undefined);
    }
    if (!multiple) {
      console.log("options", options);
      const option = options.find((opt) => opt.value === value);
      return option ? [option] : [];
    }
    return [];
  };

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => {
        const value = field.value;
        const selectedOptions = getSelectedOptions(value);
        const hasSelection = selectedOptions.length > 0;

        // Always show "Create new" option at the bottom when:
        // 1. onCreateNew callback is provided
        // 2. There's a search query
        const showCreateNew = onCreateNew && searchQuery.trim();

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
            // Single select: set the value
            field.onChange(optionValue);
            setIsOpen(false);
            setSearchQuery("");
          }
        };

        // Handle remove chip
        const handleRemoveChip = (e: React.MouseEvent, optionValue: string) => {
          e.stopPropagation();
          if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            field.onChange(currentValues.filter((v) => v !== optionValue));
          } else {
            field.onChange(undefined);
          }
        };

        // Handle create new
        const handleCreateNew = () => {
          if (onCreateNew && searchQuery.trim()) {
            onCreateNew(searchQuery.trim());
            setSearchQuery("");
          }
        };

        // Custom selector with input and chips
        const selectorContent = (
          <>
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
              {hasSelection &&
                selectedOptions.map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-hover rounded text-xs text-text shrink-0">
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveChip(e, option.value)}
                      className="hover:text-text-muted focus:outline-none cursor-pointer"
                      aria-label={`Remove ${option.label}`}>
                      <HiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Keep dropdown open when typing or clearing
                  if (!disabled) {
                    setIsOpen(true);
                  }
                }}
                onFocus={() => !disabled && setIsOpen(true)}
                placeholder={
                  hasSelection ? "" : searchPlaceholder || placeholder
                }
                disabled={disabled}
                className={cn(
                  "flex-1 min-w-[120px] bg-transparent border-0 outline-none text-text",
                  "placeholder:text-text-muted",
                  disabled && "cursor-not-allowed"
                )}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  // Keep dropdown open on typing
                  if (e.key !== "Escape" && !disabled) {
                    setIsOpen(true);
                  }

                  // Handle backspace to remove last tag when input is empty
                  if (
                    e.key === "Backspace" &&
                    !disabled &&
                    multiple &&
                    hasSelection
                  ) {
                    if (searchQuery === "" && selectedOptions.length > 0) {
                      e.preventDefault();
                      const currentValues = Array.isArray(value) ? value : [];
                      const lastTagId =
                        selectedOptions[selectedOptions.length - 1].value;
                      field.onChange(
                        currentValues.filter((v) => v !== lastTagId)
                      );
                    }
                  }
                }}
              />
            </div>
            <HiChevronDown
              className={cn(
                "w-4 h-4 text-text-muted shrink-0 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </>
        );

        return (
          <div className={cn("relative", className)}>
            {label && <Label className="mb-1">{label}</Label>}
            <Dropdown
              dropdownSelector={selectorContent}
              open={disabled ? false : isOpen}
              onOpenChange={(open) => !disabled && setIsOpen(open)}
              placement={forcePlacement}
              closeOnItemClick={!multiple}>
              {filteredOptions.length > 0 && (
                <>
                  {filteredOptions.map((option, index) => {
                    const optionIsSelected = isSelected(option.value, value);
                    const handleClick = () => handleOptionClick(option.value);
                    return (
                      <DropdownItem
                        key={option.value}
                        clicked={handleClick}>
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
                              searchQuery,
                            })
                          ) : (
                            <span className="flex-1">
                              {searchQuery.trim()
                                ? highlightText(option.label, searchQuery)
                                : option.label}
                            </span>
                          )}
                        </div>
                      </DropdownItem>
                    );
                  })}
                </>
              )}

              {filteredOptions.length === 0 &&
                searchQuery.trim() &&
                !showCreateNew && (
                  <DropdownItemEmpty>No results found</DropdownItemEmpty>
                )}

              {!searchQuery.trim() && filteredOptions.length === 0 && (
                <DropdownItemEmpty>No options available</DropdownItemEmpty>
              )}

              {showCreateNew && (
                <DropdownItem
                  clicked={() => {
                    handleCreateNew();
                  }}
                  className={cn(
                    `text-primary font-medium hover:bg-primary/10 cursor-pointer`,
                    filteredOptions.length > 0 && "mt-1 border-t border-border"
                  )}>
                  {typeof createNewLabel === "function"
                    ? createNewLabel(searchQuery.trim())
                    : `${createNewLabel} "${searchQuery.trim()}"`}
                </DropdownItem>
              )}
            </Dropdown>
            {error && (
              <p className="text-sm text-danger mt-1">
                {(error as { message?: string })?.message || String(error)}
              </p>
            )}
            {!error && hint && (
              <p className="text-xs text-text-muted/60 mt-1 flex items-center gap-1">
                <HiInformationCircle className="size-4" />
                <span>{hint}</span>
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
