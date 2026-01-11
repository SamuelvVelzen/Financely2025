import { DateInput } from "@/features/ui/input/date-input";
import { IconButton } from "@/features/ui/button/icon-button";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import {
  dateOnlyToIso,
  datetimeLocalToIso,
  isoToDateOnly,
  isoToDatetimeLocal,
} from "@/features/util/date/dateisohelpers";
import { cn } from "@/features/util/cn";
import { useRef } from "react";
import { HiClock } from "react-icons/hi";

interface IDateSelectCellProps extends IPropsWithClassName {
  // ISO date string value
  value?: string;
  // Current time precision mode
  timePrecision?: "DateTime" | "DateOnly";
  // Callback when value or precision changes
  onChange?: (value: string, timePrecision: "DateTime" | "DateOnly") => void;
}

export function DateSelectCell({
  className = "",
  value,
  timePrecision = "DateOnly",
  onChange,
}: IDateSelectCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!value) {
    return <span className="text-sm text-text-muted">—</span>;
  }

  const handleIconClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    const currentPrecision = timePrecision || "DateOnly";
    const newPrecision =
      currentPrecision === "DateTime" ? "DateOnly" : "DateTime";
    const currentDate = value;

    // When switching modes, preserve the date part
    let newDate: string;
    if (newPrecision === "DateOnly") {
      // Switching to DateOnly: extract date part and normalize to noon UTC
      newDate = dateOnlyToIso(isoToDateOnly(currentDate));
    } else {
      // Switching to DateTime: if current is DateOnly, use current time, otherwise keep existing
      if (currentPrecision === "DateOnly") {
        // Convert date-only to datetime-local with current time, then to ISO
        const dateOnly = isoToDateOnly(currentDate);
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const datetimeLocal = `${dateOnly}T${hours}:${minutes}`;
        newDate = datetimeLocalToIso(datetimeLocal);
      } else {
        newDate = currentDate;
      }
    }

    onChange?.(newDate, newPrecision);

    // Focus and open the picker
    setTimeout(() => {
      inputRef.current?.focus();
      if (inputRef.current && "showPicker" in inputRef.current) {
        inputRef.current.showPicker();
      }
    }, 0);
  };

  return (
    <div
      className="flex items-center justify-between gap-1"
      onClick={(e) => e.stopPropagation()}>
      <DateInput
        ref={inputRef}
        value={
          timePrecision === "DateTime"
            ? isoToDatetimeLocal(value)
            : isoToDateOnly(value)
        }
        type={timePrecision === "DateTime" ? "datetime-local" : "date"}
        onChange={(newValue) => {
          if (newValue) {
            const isoDate =
              timePrecision === "DateTime"
                ? datetimeLocalToIso(String(newValue))
                : dateOnlyToIso(String(newValue));
            onChange?.(isoDate, timePrecision);
          }
        }}
        className={cn("h-8 text-sm flex-1", className)}
      />
      <IconButton
        size="sm"
        clicked={handleIconClick}
        className={cn(
          "shrink-0",
          timePrecision === "DateTime" && "text-primary"
        )}
        aria-label={
          timePrecision === "DateTime"
            ? "Remove time (switch to date only)"
            : "Add time (switch to date and time)"
        }>
        <HiClock className="size-5" />
      </IconButton>
    </div>
  );
}
