"use client";

import {
  IFormOrControlledMode,
  useFormContextOptional,
} from "@/features/shared/hooks/use-form-context-optional";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { ReactNode, useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { HiChevronDown, HiX } from "react-icons/hi";
import { Checkbox } from "../checkbox/checkbox";
import { Dropdown } from "../dropdown/dropdown";
import { DropdownItem } from "../dropdown/dropdown-item";
import { NativeSelect } from "../select/native-select";
import { ISelectOption } from "../select/select";
import { Label } from "../typography/label";

export type ISelectDropdownProps<
  TOption extends ISelectOption = ISelectOption,
> = IPropsWithClassName & {
  options: TOption[] | readonly TOption[];
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  maxDisplayItems?: number;
  showClearButton?: boolean;
  children?: (
    option: TOption,
    index: number,
    context: {
      isSelected: boolean;
      handleClick: () => void;
      multiple: boolean;
    }
  ) => ReactNode;
  disabled?: boolean;
  required?: boolean;
} & IFormOrControlledMode<TOption["value"] | TOption["value"][]>;

export function SelectDropdown<TOption extends ISelectOption = ISelectOption>({
  className = "",
  name,
  options,
  multiple = false,
  placeholder = "Select...",
  label,
  maxDisplayItems = 2,
  showClearButton = true,
  children,
  disabled = false,
  required = false,
  value: controlledValue,
  onChange: controlledOnChange,
}: ISelectDropdownProps<TOption>) {
  type TValue = TOption["value"] | TOption["value"][];

  const { isMobile } = useResponsive();
  const form = useFormContextOptional();

  // Detect mode: form mode if form context exists AND name is provided
  const isFormMode = form !== null && name !== undefined;
  // Controlled mode if not in form mode and controlled props are provided
  const isControlledMode =
    !isFormMode &&
    (controlledValue !== undefined || controlledOnChange !== undefined);

  const [isOpen, setIsOpen] = useState(false);
  const error = isFormMode ? form?.formState.errors[name!] : undefined;

  // Close dropdown when disabled becomes true
  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  // Get selected labels for display
  const getDisplayText = (val: TValue | undefined): string => {
    if (!val || (Array.isArray(val) && val.length === 0)) {
      return placeholder;
    }

    if (multiple && Array.isArray(val)) {
      const selectedOptions = val
        .map((v) => options.find((opt) => opt.value === v))
        .filter((opt): opt is TOption => opt !== undefined);

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

    if (!multiple) {
      const selectedOption = options.find((opt) => opt.value === val);
      return selectedOption?.label || placeholder;
    }

    return placeholder;
  };

  // Check if option is selected
  const isSelected = (
    optionValue: string | number,
    val: TValue | undefined
  ): boolean => {
    if (!val) return false;

    if (multiple && Array.isArray(val)) {
      // For arrays, check if optionValue is included (handles string/number coercion)
      return val.some((v) => String(v) === String(optionValue));
    }

    // For single select, handle both string and number types
    // Convert both to string for comparison to handle type mismatches
    if (!multiple) {
      return String(val) === String(optionValue);
    }

    return false;
  };

  // On mobile, use native select (only works in form mode)
  if (isMobile && isFormMode) {
    return (
      <NativeSelect
        className={className}
        name={name!}
        options={options}
        multiple={multiple}
        placeholder={placeholder}
        label={label}
        disabled={disabled}
        required={required}
      />
    );
  }

  // Shared rendering logic for both controlled and form modes
  const renderSelectContent = (
    value: TValue | undefined,
    onChange: (newValue: TValue | undefined) => void,
    isFormMode: boolean
  ) => {
    const displayText = getDisplayText(value);
    const hasSelection =
      value && (Array.isArray(value) ? value.length > 0 : value !== "");

    // Handle option selection
    const handleOptionClick = (optionValue: string | number) => {
      if (disabled) return;
      if (multiple) {
        // Multiple select: toggle the option
        const currentValues: (string | number)[] = Array.isArray(value)
          ? (value as (string | number)[])
          : [];
        const newValues: (string | number)[] = currentValues.includes(
          optionValue
        )
          ? currentValues.filter((v) => v !== optionValue)
          : [...currentValues, optionValue];
        onChange(newValues as TValue);
      } else {
        // Single select: toggle selection (allow deselecting)
        if (String(value) === String(optionValue)) {
          // Deselect if already selected
          onChange(undefined);
        } else {
          // Select the option
          onChange(optionValue as TValue);
        }
        // Close dropdown after single selection
        setIsOpen(false);
      }
    };

    // Handle clear button click
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent dropdown from opening
      if (disabled) return;
      if (multiple) {
        onChange([] as unknown as TValue);
      } else {
        if (isFormMode && form && name) {
          // Reset to default value so React Hook Form recognizes it as set
          form.resetField(name);
        } else {
          onChange(undefined);
        }
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
            <span
              role="button"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              className={cn(
                "p-1 rounded text-text-muted flex items-center justify-center",
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:text-text cursor-pointer"
              )}
              aria-label="Clear selection">
              <HiX className="size-4" />
            </span>
          )}

          <HiChevronDown
            className={cn(
              "size-5 transition-transform duration-200 text-text-muted",
              disabled ? "opacity-50" : "hover:text-text",
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
          onOpenChange={(open) => {
            if (disabled && open) return;
            setIsOpen(open);
          }}
          closeOnItemClick={!multiple}
          disabled={disabled}>
          {options.map((option, index) => {
            const optionIsSelected = isSelected(option.value, value);
            const handleClick = () => handleOptionClick(option.value);
            return (
              <DropdownItem
                key={option.value}
                clicked={handleClick}
                selected={optionIsSelected}>
                <div
                  className={cn(
                    "flex items-center gap-2 w-full",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}>
                  {multiple && (
                    <Checkbox
                      checked={optionIsSelected}
                      onChange={handleClick}
                      disabled={disabled}
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
  };

  // Render controlled mode
  if (isControlledMode) {
    return renderSelectContent(
      controlledValue,
      (newValue) => controlledOnChange?.(newValue),
      false
    );
  }

  // Render form mode
  if (!form || !name) {
    throw new Error(
      "SelectDropdown: Either provide 'name' prop with form context, or provide 'value' and 'onChange' props for controlled mode"
    );
  }

  return (
    <Controller
      name={name}
      control={form.control}
      rules={{
        required: required,
      }}
      disabled={disabled}
      render={({ field }) => {
        const value = field.value as TValue | undefined;
        return renderSelectContent(
          value,
          field.onChange as (newValue: TValue | undefined) => void,
          true
        );
      }}
    />
  );
}
