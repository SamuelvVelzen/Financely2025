import { IconButton } from "@/features/ui/button/icon-button";
import { cn } from "@/features/util/cn";
import { useEffect, useRef, useState } from "react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";

export type ITimePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
};

export function TimePicker({
  value,
  onChange,
  className = "",
}: ITimePickerProps) {
  const [hours, setHours] = useState<number>(() => {
    return value.getHours();
  });

  const [minutes, setMinutes] = useState<number>(() => {
    return value.getMinutes();
  });

  const [hoursInput, setHoursInput] = useState<string>(() => {
    return String(value.getHours()).padStart(2, "0");
  });

  const [minutesInput, setMinutesInput] = useState<string>(() => {
    return String(value.getMinutes()).padStart(2, "0");
  });

  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);

  // Update local state when value prop changes
  useEffect(() => {
    const newHours = value.getHours();
    const newMinutes = value.getMinutes();
    setHours(newHours);
    setMinutes(newMinutes);
    setHoursInput(String(newHours).padStart(2, "0"));
    setMinutesInput(String(newMinutes).padStart(2, "0"));
  }, [value]);

  const updateTime = (
    newHours: number,
    newMinutes: number,
    dayOffset: number = 0
  ) => {
    setHours(newHours);
    setMinutes(newMinutes);

    // Ensure value is valid
    if (!value || isNaN(value.getTime())) {
      return;
    }

    // Create a new date with the updated time and day offset
    const updatedDate = new Date(value);
    if (dayOffset !== 0) {
      updatedDate.setDate(updatedDate.getDate() + dayOffset);
    }
    updatedDate.setHours(newHours, newMinutes, 0, 0);

    // Validate the updated date before calling onChange
    if (!isNaN(updatedDate.getTime())) {
      onChange(updatedDate);
    }
  };

  const incrementHours = () => {
    let newHours = (hours + 1) % 24;
    let dayOffset = 0;
    // If hours wrapped to 0, increment day
    if (newHours === 0 && hours === 23) {
      dayOffset = 1;
    }
    updateTime(newHours, minutes, dayOffset);
  };

  const decrementHours = () => {
    let newHours = (hours - 1 + 24) % 24;
    let dayOffset = 0;
    // If hours wrapped to 23, decrement day
    if (newHours === 23 && hours === 0) {
      dayOffset = -1;
    }
    updateTime(newHours, minutes, dayOffset);
  };

  const incrementMinutes = () => {
    let newMinutes = (minutes + 1) % 60;
    let newHours = hours;
    let dayOffset = 0;
    // If minutes wrapped to 0, increment hours
    if (newMinutes === 0 && minutes === 59) {
      newHours = (hours + 1) % 24;
      // If hours also wrapped to 0, increment day
      if (newHours === 0 && hours === 23) {
        dayOffset = 1;
      }
    }
    updateTime(newHours, newMinutes, dayOffset);
  };

  const decrementMinutes = () => {
    let newMinutes = (minutes - 1 + 60) % 60;
    let newHours = hours;
    let dayOffset = 0;
    // If minutes wrapped to 59, decrement hours
    if (newMinutes === 59 && minutes === 0) {
      newHours = (hours - 1 + 24) % 24;
      // If hours also wrapped to 23, decrement day
      if (newHours === 23 && hours === 0) {
        dayOffset = -1;
      }
    }
    updateTime(newHours, newMinutes, dayOffset);
  };

  const formatTime = (num: number): string => {
    return String(num).padStart(2, "0");
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setHoursInput(inputValue);

    // Allow empty input while typing
    if (inputValue === "") {
      return;
    }

    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      // Clamp to valid range
      if (numValue < 0) {
        setHoursInput("00");
        updateTime(0, minutes);
      } else if (numValue > 23) {
        setHoursInput("23");
        updateTime(23, minutes);
      } else {
        updateTime(numValue, minutes);
      }
    }
  };

  const handleHoursBlur = () => {
    // Format on blur
    setHoursInput(formatTime(hours));
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setMinutesInput(inputValue);

    // Allow empty input while typing
    if (inputValue === "") {
      return;
    }

    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      let newMinutes = numValue;
      let newHours = hours;
      let dayOffset = 0;

      // Handle wrapping
      if (numValue < 0) {
        newMinutes = 59;
        newHours = (hours - 1 + 24) % 24;
        if (newHours === 23 && hours === 0) {
          dayOffset = -1;
        }
        setMinutesInput("59");
        updateTime(newHours, newMinutes, dayOffset);
      } else if (numValue > 59) {
        newMinutes = 0;
        newHours = (hours + 1) % 24;
        if (newHours === 0 && hours === 23) {
          dayOffset = 1;
        }
        setMinutesInput("00");
        updateTime(newHours, newMinutes, dayOffset);
      } else {
        updateTime(hours, numValue);
      }
    }
  };

  const handleMinutesBlur = () => {
    // Format on blur
    setMinutesInput(formatTime(minutes));
  };

  return (
    <div className={cn("bg-surface p-4 w-48", className)}>
      <div className="text-sm font-medium text-text mb-3 text-center">Time</div>
      <div className="flex items-center justify-center gap-4">
        {/* Hours */}
        <div className="flex flex-col items-center gap-1">
          <IconButton
            size="sm"
            clicked={(e) => {
              e.stopPropagation();
              incrementHours();
            }}
            className="text-text-muted hover:text-text">
            <HiChevronUp className="size-4" />
          </IconButton>
          <input
            ref={hoursInputRef}
            type="number"
            min="0"
            max="23"
            value={hoursInput}
            onChange={handleHoursChange}
            onBlur={handleHoursBlur}
            style={{ MozAppearance: "textfield" }}
            className={cn(
              "text-2xl font-semibold text-text min-w-12 text-center",
              "bg-transparent border-0 outline-none",
              "focus:ring-2 focus:ring-primary rounded",
              "appearance-none",
              "[&::-webkit-inner-spin-button]:appearance-none",
              "[&::-webkit-outer-spin-button]:appearance-none"
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              // Allow arrow keys to work normally
              if (e.key === "ArrowUp") {
                e.preventDefault();
                incrementHours();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                decrementHours();
              }
            }}
          />
          <IconButton
            size="sm"
            clicked={(e) => {
              e.stopPropagation();
              decrementHours();
            }}
            className="text-text-muted hover:text-text">
            <HiChevronDown className="size-4" />
          </IconButton>
          <div className="text-xs text-text-muted mt-1">Hours</div>
        </div>

        <div className="text-2xl font-semibold text-text">:</div>

        {/* Minutes */}
        <div className="flex flex-col items-center gap-1">
          <IconButton
            size="sm"
            clicked={(e) => {
              e.stopPropagation();
              incrementMinutes();
            }}
            className="text-text-muted hover:text-text">
            <HiChevronUp className="size-4" />
          </IconButton>
          <input
            ref={minutesInputRef}
            type="number"
            min="0"
            max="59"
            value={minutesInput}
            onChange={handleMinutesChange}
            onBlur={handleMinutesBlur}
            style={{ MozAppearance: "textfield" }}
            className={cn(
              "text-2xl font-semibold text-text min-w-12 text-center",
              "bg-transparent border-0 outline-none",
              "focus:ring-2 focus:ring-primary rounded",
              "appearance-none",
              "[&::-webkit-inner-spin-button]:appearance-none",
              "[&::-webkit-outer-spin-button]:appearance-none"
            )}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              // Allow arrow keys to work normally
              if (e.key === "ArrowUp") {
                e.preventDefault();
                incrementMinutes();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                decrementMinutes();
              }
            }}
          />
          <IconButton
            size="sm"
            clicked={(e) => {
              e.stopPropagation();
              decrementMinutes();
            }}
            className="text-text-muted hover:text-text">
            <HiChevronDown className="size-4" />
          </IconButton>
          <div className="text-xs text-text-muted">Minutes</div>
        </div>
      </div>
    </div>
  );
}
