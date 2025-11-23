"use client";

import { cn } from "@/util/cn";
import {
  formatDateRange,
  getCurrentMonthEnd,
  getCurrentMonthStart,
  getLastMonthEnd,
  getLastMonthStart,
} from "@/util/date/date-helpers";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { HiCalendar, HiChevronDown } from "react-icons/hi";
import { Dropdown } from "../dropdown/dropdown";
import { DropdownDivider } from "../dropdown/dropdown-divider";
import { DropdownItem } from "../dropdown/dropdown-item";
import { CalendarView } from "./calendar-view";

export type IDateFilterType = "allTime" | "thisMonth" | "lastMonth" | "custom";

export type IDateFilter = {
  type: IDateFilterType;
  from?: string;
  to?: string;
};

export type IDefaultOption = {
  label: string;
  type: IDateFilterType;
  handler: () => IDateFilter;
};

export type IDatepickerProps = IPropsWithClassName & {
  value: IDateFilter;
  onChange: (filter: IDateFilter) => void;
  defaultOptions?: IDefaultOption[];
};

// Default options factory
const getDefaultOptions = (): IDefaultOption[] => [
  {
    label: "All Time",
    type: "allTime",
    handler: () => ({
      type: "allTime",
      from: undefined,
      to: undefined,
    }),
  },
  {
    label: "This Month",
    type: "thisMonth",
    handler: () => ({
      type: "thisMonth",
      from: getCurrentMonthStart(),
      to: getCurrentMonthEnd(),
    }),
  },
  {
    label: "Last Month",
    type: "lastMonth",
    handler: () => ({
      type: "lastMonth",
      from: getLastMonthStart(),
      to: getLastMonthEnd(),
    }),
  },
];

export function Datepicker({
  className = "",
  value,
  onChange,
  defaultOptions = getDefaultOptions(),
}: IDatepickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Parse ISO strings to Date objects for calendar
  const startDate = useMemo(() => {
    if (value.type === "custom" && value.from) {
      try {
        return parseISO(value.from);
      } catch {
        return null;
      }
    }
    return null;
  }, [value.type, value.from]);

  const endDate = useMemo(() => {
    if (value.type === "custom" && value.to) {
      try {
        return parseISO(value.to);
      } catch {
        return null;
      }
    }
    return null;
  }, [value.type, value.to]);

  const getDisplayText = (): string => {
    if (value.type === "allTime") {
      return "All Time";
    }
    if (value.type === "thisMonth") {
      return `This Month`;
    }
    if (value.type === "lastMonth") {
      return `Last Month`;
    }
    if (value.type === "custom") {
      if (value.from && value.to) {
        return formatDateRange(value.from, value.to);
      }
      return "Custom Date Range";
    }
    return "Select date range";
  };

  const handleDefaultOption = (option: IDefaultOption) => {
    const filter = option.handler();
    onChange(filter);
    setIsOpen(false);
    setShowCalendar(false);
  };

  const handleCustomClick = () => {
    // Set type to custom immediately when clicked, preserving existing dates if any
    onChange({
      type: "custom",
      from: value.type === "custom" ? value.from : undefined,
      to: value.type === "custom" ? value.to : undefined,
    });
    setShowCalendar(true);
  };

  const handleCalendarDateSelect = (start: Date | null, end: Date | null) => {
    if (start && end) {
      // Both dates selected - set the filter
      const fromDate = new Date(start);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(end);
      toDate.setHours(23, 59, 59, 999);

      onChange({
        type: "custom",
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });
    } else if (start) {
      // Only start date selected - update filter with start only, clear end
      const fromDate = new Date(start);
      fromDate.setHours(0, 0, 0, 0);

      onChange({
        type: "custom",
        from: fromDate.toISOString(),
        to: undefined, // Clear end date when only start is set
      });
    } else {
      // No dates selected - clear custom filter
      onChange({
        type: "custom",
        from: undefined,
        to: undefined,
      });
    }
  };

  // Open calendar when dropdown opens if custom is selected, close when dropdown closes
  useEffect(() => {
    if (isOpen) {
      // If custom date range is selected, automatically show calendar
      if (value.type === "custom") {
        setShowCalendar(true);
      }
    } else {
      setShowCalendar(false);
    }
  }, [isOpen, value.type]);

  // Use same base classes as Input component for consistency
  const selectorButton = (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <HiCalendar className="w-4 h-4 text-text-muted shrink-0" />
        <span className="flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis">
          {getDisplayText()}
        </span>
      </div>
      <HiChevronDown
        className={cn(
          "w-4 h-4 text-text-muted transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </>
  );

  const calendarContent = showCalendar ? (
    <CalendarView
      startDate={startDate}
      endDate={endDate}
      onDateSelect={handleCalendarDateSelect}
    />
  ) : null;

  return (
    <div className={cn("relative", className)}>
      <Dropdown
        dropdownSelector={selectorButton}
        open={isOpen}
        onOpenChange={setIsOpen}
        expandedContent={calendarContent}
        showExpanded={showCalendar}
      >
        {defaultOptions.map((option) => (
          <DropdownItem
            key={option.type}
            clicked={() => handleDefaultOption(option)}
            selected={value.type === option.type}
          >
            {option.label}
          </DropdownItem>
        ))}

        {defaultOptions.length > 0 && <DropdownDivider />}

        <DropdownItem
          clicked={handleCustomClick}
          selected={value.type === "custom"}
        >
          Custom Date Range
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
