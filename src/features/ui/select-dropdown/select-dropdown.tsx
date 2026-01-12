import {
  IFormOrControlledMode,
} from "@/features/shared/hooks/use-form-context-optional";
import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
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
import { type IValueSerialization } from "../select/select-helpers";
import { Label } from "../typography/label";

export type ISelectDropdownProps<
  TValue = string,
  TOption extends ISelectOption<TValue> = ISelectOption<TValue>,
> = IPropsWithClassName & {
  options: TOption[] | readonly TOption[];
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  maxDisplayItems?: number;
  clearable?: boolean;
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
} & IValueSerialization<TValue> &
  IFormOrControlledMode<TValue | TValue[]>;

export function SelectDropdown<
  TValue = string,
  TOption extends ISelectOption<TValue> = ISelectOption<TValue>,
>({
  className = "",
  name,
  options,
  multiple = false,
  placeholder = "Select...",
  label,
  maxDisplayItems = 2,
  clearable = true,
  children,
  disabled = false,
  required = false,
  value: controlledValue,
  onChange: controlledOnChange,
  onValueChange,
  valueToString,
  stringToValue,
}: ISelectDropdownProps<TValue, TOption>) {
  const { isMobile } = useResponsive();
  
  const { field, error, mode, form: formContext } = useFieldAdapter({
    name,
    value: controlledValue,
    onChange: controlledOnChange,
    onValueChange,
  });

  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when disabled becomes true
  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  // Get selected labels for display
  const getDisplayText = (val: TValue | TValue[] | undefined): string => {
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
    optionValue: TValue,
    val: TValue | TValue[] | undefined
  ): boolean => {
    if (!val) return false;

    if (multiple && Array.isArray(val)) {
      return val.some((v) => v === optionValue);
    }

    if (!multiple) {
      return val === optionValue;
    }

    return false;
  };

  // On mobile, use native select (only works in form mode)
  if (isMobile && mode === "form") {
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
        valueToString={valueToString}
        stringToValue={stringToValue}
      />
    );
  }

  // Shared rendering logic for both controlled and form modes
  const renderSelectContent = (currentField: typeof field) => {
    const value = currentField.value as TValue | TValue[] | undefined;
    const displayText = getDisplayText(value);
    const hasSelection =
      value !== undefined &&
      value !== null &&
      (Array.isArray(value) ? value.length > 0 : true);

    // Handle option selection
    const handleOptionClick = (optionValue: TValue) => {
      if (disabled) return;
      if (multiple) {
        // Multiple select: toggle the option
        const currentValues = Array.isArray(value) ? value : [];
        const isCurrentlySelected = currentValues.some(
          (v) => v === optionValue
        );

        if (isCurrentlySelected) {
          // If removing this item would result in empty array and clearable is false, prevent removal
          if (!clearable && currentValues.length === 1) {
            return;
          }
          // Remove the option
          const newValues = currentValues.filter((v) => v !== optionValue);
          currentField.onChange(newValues);
        } else {
          // Add the option
          const newValues = [...currentValues, optionValue];
          currentField.onChange(newValues);
        }
      } else {
        // Single select: toggle selection (allow deselecting only if clearable is true)
        if (value === optionValue) {
          // Deselect if already selected, but only if clearable is true
          if (clearable) {
            currentField.onChange(undefined);
          }
          // If clearable is false, do nothing (prevent deselection)
        } else {
          // Select the option
          currentField.onChange(optionValue);
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
        currentField.onChange([]);
      } else {
        if (mode === "form" && formContext && name) {
          // Reset to default value so React Hook Form recognizes it as set
          formContext.resetField(name);
          onValueChange?.(undefined);
        } else {
          currentField.onChange(undefined);
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
          {hasSelection && clearable && (
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
        {label && (
          <Label
            className="mb-1"
            required={required}>
            {label}
          </Label>
        )}
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
                key={String(option.value)}
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
  if (mode === "controlled") {
    return renderSelectContent(field);
  }

  // Render form mode (need Controller for rules/disabled)
  if (mode === "form" && formContext && name) {
    return (
      <Controller
        name={name}
        control={formContext.control}
        rules={{
          required: required,
        }}
        disabled={disabled}
        render={({ field: controllerField }) => {
          // Create adapter field from controller field
          const adapterField: typeof field = {
            value: controllerField.value as TValue | TValue[] | undefined,
            onChange: (value: unknown) => {
              controllerField.onChange(value);
              onValueChange?.(value as TValue | TValue[] | undefined);
            },
            onBlur: controllerField.onBlur,
            name: controllerField.name,
            ref: controllerField.ref,
          };
          return renderSelectContent(adapterField);
        }}
      />
    );
  }

  return null;
}
