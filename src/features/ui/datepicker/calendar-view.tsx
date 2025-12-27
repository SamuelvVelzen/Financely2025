"use client";

import { cn } from "@/features/util/cn";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useEffect, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

export type ICalendarViewProps = {
  startDate?: Date | null;
  endDate?: Date | null;
  onDateSelect: (start: Date | null, end: Date | null) => void;
  onClose?: () => void;
};

export function CalendarView({
  startDate,
  endDate,
  onDateSelect,
  onClose,
}: ICalendarViewProps) {
  // Determine initial month to display
  const getInitialMonth = (): Date => {
    if (startDate) return startDate;
    if (endDate) return endDate;
    return new Date();
  };

  const [currentMonth, setCurrentMonth] = useState<Date>(getInitialMonth());

  // Navigate to start date's month when it changes
  useEffect(() => {
    if (startDate && !isSameMonth(currentMonth, startDate)) {
      setCurrentMonth(startDate);
    }
  }, [startDate]);

  const handleDateClick = (date: Date) => {
    const normalizedDate = startOfDay(date);

    if (startDate && endDate) {
      // Both dates set
      const normalizedStart = startOfDay(startDate);
      const normalizedEnd = startOfDay(endDate);

      // If clicked date is before start date, reset and make it the new start
      if (normalizedDate < normalizedStart) {
        onDateSelect(normalizedDate, null);
      } else {
        // Otherwise, reset start date to clicked date
        onDateSelect(normalizedDate, null);
      }
    } else if (startDate) {
      // Only start set
      const normalizedStart = startOfDay(startDate);

      // If clicked date is before start date, reset and make it the new start
      if (normalizedDate < normalizedStart) {
        onDateSelect(normalizedDate, null);
      } else {
        // Set as end date
        onDateSelect(normalizedStart, normalizedDate);
      }
    } else {
      // No dates set: set start date
      onDateSelect(normalizedDate, null);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get calendar days for current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // Monday
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const isDateInRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false;
    const normalizedDate = startOfDay(date);
    const normalizedStart = startOfDay(startDate);
    const normalizedEnd = startOfDay(endDate);
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  };

  const isDateStart = (date: Date): boolean => {
    if (!startDate) return false;
    return isSameDay(date, startDate);
  };

  const isDateEnd = (date: Date): boolean => {
    if (!endDate) return false;
    return isSameDay(date, endDate);
  };

  const isDateInSelectedRange = (date: Date): boolean => {
    if (!startDate || !endDate) return false;
    const normalizedDate = startOfDay(date);
    const normalizedStart = startOfDay(startDate);
    const normalizedEnd = startOfDay(endDate);
    return normalizedDate > normalizedStart && normalizedDate < normalizedEnd;
  };

  const isCurrentMonth = (date: Date): boolean => {
    return isSameMonth(date, currentMonth);
  };

  return (
    <div className="w-80 bg-surface p-4">
      {/* Month/Year Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="p-1 rounded-2xl hover:bg-surface-hover text-text-muted hover:text-text transition-colors">
          <HiChevronLeft className="size-5" />
        </button>
        <h3 className="text-lg font-semibold text-text">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded-2xl hover:bg-surface-hover text-text-muted hover:text-text transition-colors">
          <HiChevronRight className="size-5" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-text-muted py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isStart = isDateStart(day);
          const isEnd = isDateEnd(day);
          const inRange = isDateInSelectedRange(day);
          const inFullRange = isDateInRange(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isToday = isSameDay(day, new Date());
          // Check if weekend (Saturday = 6, Sunday = 0)
          const dayOfWeek = day.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

          // Check if only start date is selected (no end date)
          const onlyStartSelected = startDate && !endDate && isStart;

          // Determine position in range for continuous line styling
          const getRangePosition = () => {
            if (!startDate || !endDate) return null;
            const normalizedDate = startOfDay(day);
            const normalizedStart = startOfDay(startDate);
            const normalizedEnd = startOfDay(endDate);

            if (
              normalizedDate < normalizedStart ||
              normalizedDate > normalizedEnd
            ) {
              return null;
            }

            // Check if previous/next day is in range (for continuous line)
            const prevDay = new Date(day);
            prevDay.setDate(prevDay.getDate() - 1);
            const nextDay = new Date(day);
            nextDay.setDate(nextDay.getDate() + 1);
            const prevInRange =
              normalizedStart <= startOfDay(prevDay) &&
              startOfDay(prevDay) <= normalizedEnd;
            const nextInRange =
              normalizedStart <= startOfDay(nextDay) &&
              startOfDay(nextDay) <= normalizedEnd;

            if (isStart && isEnd) return { type: "single" };
            if (isStart) return { type: "start", hasNext: nextInRange };
            if (isEnd) return { type: "end", hasPrev: prevInRange };
            if (inRange)
              return {
                type: "middle",
                hasPrev: prevInRange,
                hasNext: nextInRange,
              };
            return null;
          };

          const rangePosition = getRangePosition();

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(day)}
              className={cn(
                "relative h-10 text-sm transition-colors",
                "hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                !isCurrentMonthDay && "text-text-muted opacity-50",
                isCurrentMonthDay && "text-text",
                // Weekend background (only when not in range and not selected)
                isWeekend &&
                  !inFullRange &&
                  !isStart &&
                  !isEnd &&
                  !onlyStartSelected &&
                  "bg-surface-hover/50",
                // Today styling - more distinct
                isToday &&
                  !inFullRange &&
                  !isStart &&
                  !isEnd &&
                  !onlyStartSelected &&
                  "font-bold ring-2 ring-primary/50",
                // Today styling when in selected range - add ring on top of selected style
                isToday &&
                  (inFullRange || isStart || isEnd || onlyStartSelected) &&
                  "ring-2 ring-white/80",
                // Selected start date (when only start is selected, no end) - same style as range
                onlyStartSelected &&
                  "bg-primary text-white hover:bg-primary/90 rounded-2xl",
                // Continuous range background
                rangePosition?.type === "single" &&
                  "bg-primary text-white hover:bg-primary/90 rounded-2xl",
                rangePosition?.type === "start" &&
                  "bg-primary text-white hover:bg-primary/90",
                rangePosition?.type === "end" &&
                  "bg-primary text-white hover:bg-primary/90",
                rangePosition?.type === "middle" && "bg-primary/20",
                // Round left corner only on start date or first day of week in range
                rangePosition?.type === "start" && "rounded-l-2xl",
                rangePosition?.type === "middle" &&
                  "hasPrev" in rangePosition &&
                  rangePosition.hasPrev === false &&
                  (day.getDay() === 1 || day.getDay() === 0) &&
                  "rounded-l-2xl",
                // Round right corner only on end date or last day of week in range
                rangePosition?.type === "end" && "rounded-r-2xl",
                rangePosition?.type === "middle" &&
                  "hasNext" in rangePosition &&
                  rangePosition.hasNext === false &&
                  (day.getDay() === 0 || day.getDay() === 6) &&
                  "rounded-r-2xl",
                // Fallback for dates in range but not styled above
                inFullRange && !rangePosition && "bg-primary/20",
                // Default styling when not in range and not selected
                !inFullRange &&
                  !isStart &&
                  !isEnd &&
                  !onlyStartSelected &&
                  "rounded-2xl"
              )}>
              <span className="relative z-10">{format(day, "d")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
