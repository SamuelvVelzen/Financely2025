import { IconButton } from "@/features/ui/button/icon-button";
import { DateInput } from "@/features/ui/input/date-input";
import { cn } from "@/features/util/cn";
import {
  dateOnlyToIso,
  isoToDateOnly,
} from "@/features/util/date/dateisohelpers";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
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
      // Switching to DateTime: if current is DateOnly, use noon UTC placeholder (consistent with rest of codebase)
      if (currentPrecision === "DateOnly") {
        // Convert date-only to datetime with noon UTC placeholder
        const dateOnly = isoToDateOnly(currentDate);
        newDate = dateOnlyToIso(dateOnly);
      } else {
        newDate = currentDate;
      }
    }

    onChange?.(newDate, newPrecision);
  };

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}>
      <DateInput
        value={value}
        mode={timePrecision === "DateTime" ? "dateTime" : "dateOnly"}
        onChange={(newValue) => {
          if (newValue) {
            onChange?.(newValue, timePrecision);
          }
        }}
        className="flex-1"
      />
      <IconButton
        size="sm"
        clicked={handleIconClick}
        className={cn(
          "shrink-0",
          timePrecision === "DateTime" && "text-primary"
        )}
        tooltip={
          timePrecision === "DateTime"
            ? "Remove time (switch to date only)"
            : "Add time (switch to date and time)"
        }
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
