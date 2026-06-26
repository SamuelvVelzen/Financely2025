import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import { type IFormOrControlledMode } from "@/features/shared/hooks/use-form-context-optional";
import { CalendarView } from "@/features/ui/datepicker/calendar-view";
import { TimePicker } from "@/features/ui/datepicker/time-picker";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import {
  dateOnlyToIso,
  isoToDateOnly,
} from "@/features/util/date/dateisohelpers";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import { parseISO } from "date-fns";
import {
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { HiChevronDown, HiClock } from "react-icons/hi";

export type IDateInputProps = IPropsWithClassName & {
  mode?: "dateOnly" | "dateTime";
  label?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  selectorClassName?: string;
  placeholder?: string;
  onAddTime?: () => void;
  onRemoveTime?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} & IFormOrControlledMode<string>;

export function DateInput({
  className = "",
  mode = "dateOnly",
  label,
  hint,
  required,
  disabled = false,
  selectorClassName,
  placeholder = "Select date",
  onAddTime,
  onRemoveTime,
  open: controlledOpen,
  onOpenChange,
  name,
  value: controlledValue,
  onChange: controlledOnChange,
  onValueChange,
}: IDateInputProps) {
  const {
    borderClass,
    shouldShowError,
    error,
    mode: adapterMode,
    renderWithController,
  } = useFieldAdapter({
    name,
    value: controlledValue,
    onChange: controlledOnChange,
    onValueChange,
  });
  const [internalOpen, setInternalOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (newState: boolean) => {
    if (onOpenChange) {
      onOpenChange(newState);
    } else {
      setInternalOpen(newState);
    }
  };

  // Helper to convert value based on mode
  const convertToFormFormat = (
    isoValue: string | undefined
  ): string | undefined => {
    if (!isoValue) return undefined;
    if (mode === "dateOnly") {
      return isoToDateOnly(isoValue);
    }
    return isoValue;
  };

  // Helper to convert from form format
  const convertFromFormFormat = (
    formValue: string | undefined
  ): string | undefined => {
    if (!formValue) return undefined;
    if (mode === "dateOnly") {
      // Form value is YYYY-MM-DD, convert to ISO
      return dateOnlyToIso(formValue.split("T")[0]);
    }
    return formValue;
  };

  // Helper to parse ISO string to Date object
  const parseDate = (isoString: string | undefined): Date | null => {
    if (!isoString) return null;
    try {
      return parseISO(isoString);
    } catch {
      return null;
    }
  };

  // Helper to format display text
  const formatDisplayText = (isoString: string | undefined): string => {
    if (!isoString) return placeholder;
    try {
      return DateFormatHelpers.formatIsoStringToString(
        isoString,
        mode === "dateTime" ? "DateTime" : "DateOnly"
      );
    } catch {
      return placeholder;
    }
  };

  // Shared rendering logic
  const renderDateInput = (
    currentField: ControllerRenderProps<Record<string, unknown>, string>
  ) => {
    const value = currentField.value as string | undefined;
    // Convert form value to ISO for internal use (calendar/time picker)
    const isoValue =
      adapterMode === "form" && mode === "dateOnly"
        ? convertFromFormFormat(value)
        : value;
    const selectedDate = parseDate(isoValue);
    const displayText = formatDisplayText(isoValue);
    const hasValue = !!value;
    const showInput = isOpen || !hasValue;
    const timePrecision = mode === "dateTime" ? "DateTime" : "DateOnly";
    const inputPlaceholder =
      placeholder === "Select date"
        ? DateFormatHelpers.getDateInputPlaceholder(timePrecision)
        : placeholder;

    const applyDate = (
      date: Date,
      options: { close?: boolean; syncInput?: boolean } = {},
    ) => {
      if (isNaN(date.getTime())) return;

      let newIsoValue: string;
      if (mode === "dateOnly") {
        const dateOnly = isoToDateOnly(date.toISOString());
        newIsoValue = dateOnlyToIso(dateOnly);
      } else {
        const baseDate = selectedDate || new Date();
        const updatedDate = new Date(date);
        updatedDate.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
        newIsoValue = updatedDate.toISOString();
      }

      const formValue =
        adapterMode === "form" && mode === "dateOnly"
          ? convertToFormFormat(newIsoValue)
          : newIsoValue;

      currentField.onChange(formValue);
      if (options.syncInput !== false) {
        setInputText(formatDisplayText(newIsoValue));
      }

      if (options.close && mode === "dateOnly") {
        setIsOpen(false);
      }
    };

    const commitInputText = (options: { close?: boolean } = {}) => {
      const trimmed = inputText.trim();
      if (!trimmed) {
        currentField.onChange(undefined);
        setInputText("");
        if (options.close) {
          setIsOpen(false);
        }
        return true;
      }

      const parsed = DateFormatHelpers.parseStringToDate(
        trimmed,
        timePrecision,
      );
      if (!parsed) {
        return false;
      }

      applyDate(parsed, options);
      return true;
    };

    const handleOpenChange = (open: boolean) => {
      if (disabled) return;

      if (open) {
        setIsOpen(true);
        const nextInputText =
          isoValue && displayText !== placeholder ? displayText : "";
        setInputText(nextInputText);
        setTimeout(() => {
          const input = inputRef.current;
          if (input) {
            input.focus();
            input.select();
          }
        }, 0);
        return;
      }

      if (inputText.trim()) {
        commitInputText();
      }
      setInputText("");
      setIsOpen(false);
    };

    // Handle date selection from calendar
    const handleDateSelect = (date: Date | null) => {
      if (!date || isNaN(date.getTime())) return;
      applyDate(date, { close: mode === "dateOnly" });
    };

    // Handle time change from time picker
    const handleTimeChange = (date: Date) => {
      // Ensure we have a valid date
      if (!date || isNaN(date.getTime())) {
        return;
      }

      // Use the date directly from TimePicker, which already includes any day changes
      // The TimePicker handles day increments/decrements when hours wrap
      const isoString = date.toISOString();
      if (isoString) {
        // Convert to form format if needed
        const formValue =
          adapterMode === "form" && mode === "dateOnly"
            ? convertToFormFormat(isoString)
            : isoString;
        currentField.onChange(formValue);
      }
    };

    // Trigger for dropdown — combobox-style like Select
    const triggerButton = (
      <div className="flex w-full min-w-0 flex-1 items-center gap-2 px-2">
        <div className="flex min-w-0 flex-1 items-center">
          {!showInput && hasValue ? (
            <span className="min-w-0 flex-1 truncate text-left text-sm text-text">
              {displayText}
            </span>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(event) => {
                const nextText = event.target.value;
                setInputText(nextText);
                if (!disabled) {
                  setIsOpen(true);
                }

                const parsed = DateFormatHelpers.parseStringToDate(
                  nextText,
                  timePrecision,
                );
                if (parsed) {
                  applyDate(parsed, { syncInput: false });
                }
              }}
              onFocus={() => !disabled && setIsOpen(true)}
              onBlur={() => {
                if (inputText.trim()) {
                  commitInputText();
                }
              }}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (commitInputText({ close: true })) {
                    setIsOpen(false);
                  }
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setInputText("");
                  setIsOpen(false);
                  return;
                }

                if (event.key !== "Tab" && !disabled) {
                  setIsOpen(true);
                }
              }}
              placeholder={inputPlaceholder}
              disabled={disabled}
              className={cn(
                "min-w-0 flex-1 bg-transparent border-0 outline-none text-sm text-text",
                "placeholder:text-text-muted",
                disabled && "cursor-not-allowed",
              )}
              onClick={(event) => event.stopPropagation()}
            />
          )}
        </div>
        <HiChevronDown
          className={cn(
            "size-5 shrink-0 text-text-muted transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </div>
    );

    const showEmbeddedTimeToggle = !!(onAddTime || onRemoveTime);

    const handleEmbeddedTimeToggle = (event: MouseEvent) => {
      event.stopPropagation();
      if (mode === "dateTime") {
        onRemoveTime?.();
      } else {
        onAddTime?.();
      }
    };

    // Expanded content with time picker (dateTime mode)
    const expandedContent =
      mode === "dateTime" &&
      (() => {
        const timePickerDate = selectedDate || new Date();
        if (isNaN(timePickerDate.getTime())) {
          return null;
        }
        return (
          <div className="flex flex-col justify-between h-full bg-surface">
            <TimePicker
              value={timePickerDate}
              onChange={handleTimeChange}
            />
          </div>
        );
      })();

    const embeddedSelectorClassName = cn(
      "min-w-0 w-full flex-1 !justify-start border-0 rounded-none rounded-l-2xl !h-full !min-h-9 bg-transparent px-0 hover:bg-surface-hover !shadow-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
      isOpen && "ring-2 ring-inset ring-primary",
      selectorClassName,
    );

    const dateDropdown = (
      <Dropdown
        dropdownSelector={triggerButton}
        selectorClassName={
          showEmbeddedTimeToggle ? embeddedSelectorClassName : selectorClassName
        }
        open={isOpen}
        onOpenChange={handleOpenChange}
        expandedContent={expandedContent || undefined}
        showExpanded={!!expandedContent}
        closeOnItemClick={false}
        selectorToggles={false}
        disabled={disabled}>
        <Dropdown.Panel className="overflow-hidden w-full">
          <CalendarView
            startDate={selectedDate}
            endDate={null}
            onDateSelect={(start, _end) => handleDateSelect(start)}
            timeSupported={
              !showEmbeddedTimeToggle && mode === "dateOnly" && !!onAddTime
            }
            onAddTime={onAddTime}
          />
        </Dropdown.Panel>
      </Dropdown>
    );

    const fieldErrors = shouldShowError && error?.message && (
      <p className="text-sm text-danger mt-1">{error.message}</p>
    );

    const fieldHint = !shouldShowError && hint && (
      <p className="text-xs text-text-muted mt-1">{hint}</p>
    );

    if (showEmbeddedTimeToggle) {
      return (
        <div className={cn(className)}>
          {label && (
            <Label
              htmlFor={name}
              required={required}
              className="mb-1">
              {label}
            </Label>
          )}
          <div
            className={cn(
              "flex w-full items-stretch overflow-hidden rounded-2xl border bg-surface text-base text-text hover:bg-surface-hover",
              borderClass,
              disabled && "opacity-50 cursor-not-allowed",
            )}>
            <div className="flex min-w-0 flex-1 self-stretch [&_[data-dropdown-container]]:min-w-0 [&_[data-dropdown-container]]:flex-1 [&_[data-dropdown-trigger]]:flex [&_[data-dropdown-trigger]]:h-full [&_[data-dropdown-trigger]]:w-full [&_[data-dropdown-trigger]]:min-h-0">
              {dateDropdown}
            </div>

            <div
              className="w-px shrink-0 self-stretch bg-border"
              aria-hidden
            />

            <button
              type="button"
              disabled={disabled}
              onClick={handleEmbeddedTimeToggle}
              className={cn(
                "flex shrink-0 items-center gap-1.5 self-stretch rounded-r-2xl px-2.5 text-sm text-text-muted hover:bg-surface-hover hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary disabled:cursor-not-allowed",
                mode === "dateTime" && "text-primary",
              )}
              aria-label={mode === "dateTime" ? "Remove time" : "Add time"}>
              <HiClock className="size-4 shrink-0" />
              <span className="whitespace-nowrap">
                {mode === "dateTime" ? "Remove time" : "Add time"}
              </span>
            </button>
          </div>
          {fieldErrors}
          {fieldHint}
        </div>
      );
    }

    return (
      <div className={cn(className)}>
        {label && (
          <Label
            htmlFor={name}
            required={required}
            className="mb-1">
            {label}
          </Label>
        )}
        {dateDropdown}
        {fieldErrors}
        {fieldHint}
      </div>
    );
  };

  // Render using the adapter
  return renderWithController((currentField) => {
    return renderDateInput(currentField);
  });
}
