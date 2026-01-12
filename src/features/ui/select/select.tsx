import {
  IFormOrControlledMode,
  useFormContextOptional,
} from "@/features/shared/hooks/use-form-context-optional";
import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { useResponsive } from "@/features/shared/hooks/useResponsive";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { HiChevronDown, HiInformationCircle, HiX } from "react-icons/hi";
import { Checkbox } from "../checkbox/checkbox";
import { Dropdown } from "../dropdown/dropdown";
import { DropdownItem } from "../dropdown/dropdown-item";
import { DropdownItemEmpty } from "../dropdown/dropdown-item-empty";
import type { IPlacementOption } from "../dropdown/hooks/use-dropdown-placement";
import { Label } from "../typography/label";
import { NativeSelect } from "./native-select";
import { type IValueSerialization } from "./select-helpers";

export type ISelectOption<TValue = string> = {
  value: TValue;
  label: string;
};

export type ISelectProps<
  TValue = string,
  TOption extends ISelectOption<TValue> = ISelectOption<TValue>,
> = IPropsWithClassName & {
  options: TOption[] | readonly TOption[];
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  hint?: string;
  children?: (
    option: TOption,
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
  getOptionSearchValue?: (option: TOption) => string;
  forcePlacement?: IPlacementOption[];
  required?: boolean;
} & IValueSerialization<TValue> &
  IFormOrControlledMode<TValue | TValue[]>;

export function Select<
  TValue = string,
  TOption extends ISelectOption<TValue> = ISelectOption<TValue>,
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
  required = false,
  value: controlledValue,
  onChange: controlledOnChange,
  valueToString,
  stringToValue,
}: ISelectProps<TValue, TOption>) {
  const { isMobile } = useResponsive();
  const form = useFormContextOptional();

  // Determine mode
  const isFormMode = !!name && !!form;
  const isControlledMode =
    controlledValue !== undefined && !!controlledOnChange;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [initializedUnmatchedValue, setInitializedUnmatchedValue] = useState<
    string | null
  >(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const error = isFormMode && form ? form.formState.errors[name] : undefined;

  const { highlightText } = useHighlightText();

  // Helper functions (defined before hooks to avoid issues)
  const getUnmatchedValues = (
    value: TValue | TValue[] | undefined
  ): TValue[] => {
    if (!value) {
      return [];
    }
    if (multiple && Array.isArray(value)) {
      const unmatched = value.filter(
        (val) => !options.some((opt) => opt.value === val)
      );
      return unmatched;
    }
    if (!multiple && typeof value === "string") {
      const exists = options.some((opt) => opt.value === value);
      return exists ? [] : [value];
    }
    return [];
  };

  // Filter options based on search query
  // NOTE: This hook must be called before any early returns to maintain hook order
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

  // Get current unmatched values
  // NOTE: This hook must be called before any early returns to maintain hook order
  const currentUnmatchedValues = useMemo(() => {
    const currentValue = isControlledMode
      ? controlledValue
      : isFormMode && form && name
        ? (form.getValues(name) as TValue | TValue[] | undefined)
        : undefined;
    return getUnmatchedValues(currentValue);
  }, [
    isControlledMode,
    controlledValue,
    isFormMode,
    form,
    name,
    multiple,
    options,
  ]);

  // Reset initialized value if unmatched values changed to a different value
  // NOTE: This hook must be called before any early returns to maintain hook order
  useEffect(() => {
    const firstUnmatched =
      currentUnmatchedValues.length > 0
        ? String(currentUnmatchedValues[0])
        : null;

    // If the unmatched value changed to a different value, reset the initialized value
    // This allows new unmatched values to be initialized when dropdown opens
    if (
      firstUnmatched !== null &&
      firstUnmatched !== initializedUnmatchedValue
    ) {
      setInitializedUnmatchedValue(null);
    }

    // If there are no unmatched values, reset the initialized value
    if (firstUnmatched === null && initializedUnmatchedValue !== null) {
      setInitializedUnmatchedValue(null);
    }
  }, [currentUnmatchedValues, initializedUnmatchedValue]);

  // Initialize search query when unmatched values change
  // Note: We initialize even when dropdown is closed, so it's ready when user opens it
  // NOTE: This hook must be called before any early returns to maintain hook order
  useEffect(() => {
    if (
      onCreateNew &&
      currentUnmatchedValues.length > 0 &&
      !searchQuery.trim()
    ) {
      const firstUnmatched = String(currentUnmatchedValues[0]);

      // Only initialize if this is a different unmatched value than what we initialized before
      if (initializedUnmatchedValue !== firstUnmatched) {
        setSearchQuery(firstUnmatched);
        setInitializedUnmatchedValue(firstUnmatched);
        // Focus the input if dropdown is open
        if (isOpen) {
          setTimeout(() => {
            const input = inputRef.current;
            if (input) {
              input.focus();
              // Move cursor to end of input
              const length = input.value.length;
              input.setSelectionRange(length, length);
            }
          }, 0);
        }
      }
    }
  }, [
    currentUnmatchedValues,
    onCreateNew,
    searchQuery,
    initializedUnmatchedValue,
    isOpen,
  ]);

  // On mobile, use native select (only supports form mode for now)
  if (isMobile && isFormMode && form) {
    return (
      <NativeSelect
        className={className}
        name={name}
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

  // Check if option is selected
  const isSelected = (
    optionValue: TValue,
    value: TValue | TValue[] | undefined
  ): boolean => {
    if (!value) return false;

    if (multiple && Array.isArray(value)) {
      return value.some((v) => v === optionValue);
    }

    if (!multiple) {
      return value === optionValue;
    }

    return false;
  };

  // Get selected options
  const getSelectedOptions = (
    value: TValue | TValue[] | undefined
  ): TOption[] => {
    if (!value) return [];
    if (multiple && Array.isArray(value)) {
      // Preserve the order from the value array (FIFO)
      return value
        .map((val) => options.find((opt) => opt.value === val))
        .filter((opt): opt is TOption => opt !== undefined);
    }
    if (!multiple) {
      const option = options.find((opt) => opt.value === value);
      return option ? [option] : [];
    }
    return [];
  };

  // Shared rendering logic
  const renderSelectContent = (
    value: TValue | TValue[] | undefined,
    onChange: (newValue: TValue | TValue[] | undefined) => void
  ) => {
    const selectedOptions = getSelectedOptions(value);
    const hasSelection = selectedOptions.length > 0;

    // Always show "Create new" option at the bottom when:
    // 1. onCreateNew callback is provided
    // 2. There's a search query
    const showCreateNew = onCreateNew && searchQuery.trim();

    // Handle option selection
    const handleOptionClick = (optionValue: TValue) => {
      if (multiple) {
        // Multiple select: toggle the option
        const currentValues = Array.isArray(value) ? value : [];
        const newValues = currentValues.some((v) => v === optionValue)
          ? currentValues.filter((v) => v !== optionValue)
          : [...currentValues, optionValue];
        onChange(newValues);
      } else {
        // Single select: set the value
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    // Handle remove chip
    const handleRemoveChip = (e: React.MouseEvent, optionValue: TValue) => {
      e.stopPropagation();
      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        onChange(currentValues.filter((v) => v !== optionValue));
      } else {
        onChange(undefined);
      }
    };

    // Handle create new
    const handleCreateNew = () => {
      if (onCreateNew && searchQuery.trim()) {
        onCreateNew(searchQuery.trim());
        setSearchQuery("");
      }
    };

    // Handle dropdown open/close
    const handleOpenChange = (open: boolean) => {
      if (!disabled) {
        setIsOpen(open);

        // Pre-fill search query when opening dropdown with unmatched values
        if (open && onCreateNew) {
          if (currentUnmatchedValues.length > 0 && !searchQuery.trim()) {
            const firstUnmatched = String(currentUnmatchedValues[0]);

            // Only initialize if this is a different unmatched value than what we initialized before
            // If initializedUnmatchedValue matches firstUnmatched, user has already seen/cleared it
            if (initializedUnmatchedValue !== firstUnmatched) {
              setSearchQuery(firstUnmatched);
              setInitializedUnmatchedValue(firstUnmatched);
              // Focus the input so the user can see the pre-filled value
              setTimeout(() => {
                const input = inputRef.current;
                if (input) {
                  input.focus();
                  // Move cursor to end of input
                  const length = input.value.length;
                  input.setSelectionRange(length, length);
                }
              }, 0);
            }
          }
        } else if (!open) {
          // Reset search query when closing
          setSearchQuery("");
        }
      }
    };

    // Custom selector with input and chips
    const selectorContent = (
      <>
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {hasSelection &&
            selectedOptions.map((option) => (
              <span
                key={String(option.value)}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-hover rounded text-xs text-text shrink-0">
                {option.label}
                <button
                  type="button"
                  onClick={(e) => handleRemoveChip(e, option.value)}
                  className="hover:text-text-muted focus:outline-none cursor-pointer"
                  aria-label={`Remove ${option.label}`}>
                  <HiX className="size-3" />
                </button>
              </span>
            ))}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const newValue = e.target.value;
              setSearchQuery(newValue);

              // If user clears the search query and we had initialized a value,
              // keep the initialized value set so it won't be restored when reopening
              // (we don't reset it here - the initialized value stays to prevent re-initialization)

              // Keep dropdown open when typing or clearing
              if (!disabled) {
                setIsOpen(true);
              }
            }}
            onFocus={() => !disabled && setIsOpen(true)}
            placeholder={hasSelection ? "" : searchPlaceholder || placeholder}
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
                  onChange(currentValues.filter((v) => v !== lastTagId));
                }
              }
            }}
          />
        </div>
        <HiChevronDown
          className={cn(
            "size-4 text-text-muted shrink-0 transition-transform duration-200",
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
          onOpenChange={handleOpenChange}
          placement={forcePlacement}
          closeOnItemClick={!multiple}>
          {filteredOptions.length > 0 && (
            <>
              {filteredOptions.map((option, index) => {
                const optionIsSelected = isSelected(option.value, value);
                const handleClick = () => handleOptionClick(option.value);
                return (
                  <DropdownItem
                    key={String(option.value)}
                    clicked={handleClick}
                    selected={optionIsSelected}>
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
                          {highlightText(option.label, searchQuery)}
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
  };

  // Render controlled mode
  if (isControlledMode) {
    return renderSelectContent(controlledValue, (newValue) => {
      controlledOnChange?.(newValue);
    });
  }

  // Render form mode
  if (isFormMode && form) {
    return (
      <Controller
        name={name}
        control={form.control}
        rules={{
          required: required,
        }}
        disabled={disabled}
        render={({ field }) => {
          return renderSelectContent(
            field.value as TValue | TValue[] | undefined,
            field.onChange
          );
        }}
      />
    );
  }

  // Fallback (should not happen with proper discriminated union)
  return null;
}
