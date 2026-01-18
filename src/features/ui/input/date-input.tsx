import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import { IFormOrControlledMode } from "@/features/shared/hooks/use-form-context-optional";
import { Button } from "@/features/ui/button/button";
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
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { parseISO } from "date-fns";
import { useState } from "react";
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
    field,
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
  const renderDateInput = (currentField: typeof field) => {
    const value = currentField.value as string | undefined;
    // Convert form value to ISO for internal use (calendar/time picker)
    const isoValue =
      adapterMode === "form" && mode === "dateOnly"
        ? convertFromFormFormat(value)
        : value;
    const selectedDate = parseDate(isoValue);
    const displayText = formatDisplayText(isoValue);

    // Handle date selection from calendar
    const handleDateSelect = (date: Date | null) => {
      if (!date || isNaN(date.getTime())) return;

      let newIsoValue: string;
      if (mode === "dateOnly") {
        // For dateOnly mode, convert to ISO with noon UTC
        const dateOnly = isoToDateOnly(date.toISOString());
        newIsoValue = dateOnlyToIso(dateOnly);
        // Close dropdown after selecting date in dateOnly mode
        setIsOpen(false);
      } else {
        // For dateTime mode, preserve the time from selectedDate if it exists, otherwise use current time
        const baseDate = selectedDate || new Date();
        const updatedDate = new Date(date);
        updatedDate.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
        newIsoValue = updatedDate.toISOString();
        // Keep dropdown open in dateTime mode so user can set time
      }

      // Convert to form format if needed
      const formValue =
        adapterMode === "form" && mode === "dateOnly"
          ? convertToFormFormat(newIsoValue)
          : newIsoValue;

      currentField.onChange(formValue);
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

    // Trigger button for dropdown
    const triggerButton = (
      <div className="flex justify-between w-full">
        <span className={cn("text-sm", !value && "text-text-muted")}>
          {displayText}
        </span>
        <HiChevronDown
          className={cn(
            "size-5 text-text-muted transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </div>
    );

    // Expanded content with time picker (only for dateTime mode)
    const expandedContent =
      mode === "dateTime" &&
      (() => {
        // Ensure we always pass a valid date to TimePicker
        const timePickerDate = selectedDate || new Date();
        // Validate the date
        if (isNaN(timePickerDate.getTime())) {
          return null;
        }
        return (
          <div className="flex flex-col justify-between h-full">
            <TimePicker
              value={timePickerDate}
              onChange={handleTimeChange}
            />
            {onRemoveTime && (
              <div className="p-4 pt-0">
                <Button
                  clicked={(e) => {
                    e.stopPropagation();
                    onRemoveTime();
                  }}
                  variant="default"
                  size="sm"
                  className="w-full">
                  <div className="flex items-center justify-center gap-2">
                    <HiClock className="size-4" />
                    <span>Remove time</span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        );
      })();

    return (
      <div className={cn(label || hint ? "space-y-1" : "", className)}>
        {label && (
          <Label
            htmlFor={name}
            required={required}>
            {label}
          </Label>
        )}
        <Dropdown
          dropdownSelector={triggerButton}
          selectorClassName={selectorClassName}
          open={isOpen}
          onOpenChange={setIsOpen}
          expandedContent={expandedContent || undefined}
          showExpanded={!!expandedContent}
          closeOnItemClick={false}
          disabled={disabled}>
          <CalendarView
            startDate={selectedDate}
            endDate={null}
            onDateSelect={(start, _end) => handleDateSelect(start)}
            timeSupported={mode === "dateOnly" && !!onAddTime}
            onAddTime={onAddTime}
          />
        </Dropdown>
        {shouldShowError && error?.message && (
          <p className="text-sm text-danger mt-1">{error.message}</p>
        )}
        {!shouldShowError && hint && (
          <p className="text-xs text-text-muted mt-1">{hint}</p>
        )}
      </div>
    );
  };

  // Render using the adapter
  return renderWithController((currentField) => {
    return renderDateInput(currentField);
  });
}
