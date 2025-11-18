"use client";

import { cn } from "@/util/cn";
import {
  formatMonthYear,
  getCurrentMonthEnd,
  getCurrentMonthStart,
  getLastMonthEnd,
  getLastMonthStart,
} from "@/util/date/date-helpers";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { useEffect, useState } from "react";
import { HiCalendar, HiChevronDown } from "react-icons/hi";
import { Dropdown } from "../dropdown/dropdown";
import { DropdownItem } from "../dropdown/dropdown-item";

export type DateFilterType = "allTime" | "thisMonth" | "lastMonth" | "custom";

export type DateFilter = {
  type: DateFilterType;
  from?: string;
  to?: string;
};

export type IDatepickerProps = IPropsWithClassName & {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
};

export function Datepicker({
  className = "",
  value,
  onChange,
}: IDatepickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  // Format ISO date to YYYY-MM-DD for input
  const formatDateForInput = (isoString?: string): string => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Sync local state with value prop when in custom mode
  useEffect(() => {
    if (value.type === "custom") {
      setCustomFrom(formatDateForInput(value.from));
      setCustomTo(formatDateForInput(value.to));
    }
  }, [value.type, value.from, value.to]);

  const getDisplayText = (): string => {
    if (value.type === "allTime") {
      return "All Time";
    }
    if (value.type === "thisMonth") {
      return `This Month`;
    }
    if (value.type === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return `Last Month`;
    }
    if (value.type === "custom") {
      if (value.from && value.to) {
        return `${formatMonthYear(value.from)} - ${formatMonthYear(value.to)}`;
      }
      return "Custom Date Range";
    }
    return "Select date range";
  };

  const handleAllTime = () => {
    onChange({
      type: "allTime",
      from: undefined,
      to: undefined,
    });
    setIsOpen(false);
  };

  const handleThisMonth = () => {
    onChange({
      type: "thisMonth",
      from: getCurrentMonthStart(),
      to: getCurrentMonthEnd(),
    });
    setIsOpen(false);
  };

  const handleLastMonth = () => {
    onChange({
      type: "lastMonth",
      from: getLastMonthStart(),
      to: getLastMonthEnd(),
    });
    setIsOpen(false);
  };

  const handleCustomDateChange = () => {
    if (customFrom && customTo) {
      // Convert date strings to ISO format
      const fromDate = new Date(customFrom);
      const toDate = new Date(customTo);
      // Set to end of day for 'to' date
      toDate.setHours(23, 59, 59, 999);

      onChange({
        type: "custom",
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });
    }
  };

  const handleCustomFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = e.target.value;
    setCustomFrom(newFrom);
    // Update filter if both dates are set
    if (newFrom && customTo) {
      const fromDate = new Date(newFrom);
      const toDate = new Date(customTo);
      toDate.setHours(23, 59, 59, 999);
      onChange({
        type: "custom",
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });
    }
  };

  const handleCustomToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = e.target.value;
    setCustomTo(newTo);
    // Update filter if both dates are set
    if (customFrom && newTo) {
      const fromDate = new Date(customFrom);
      const toDate = new Date(newTo);
      toDate.setHours(23, 59, 59, 999);
      onChange({
        type: "custom",
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });
    }
  };

  // Initialize custom dates when switching to custom mode
  const handleCustomClick = () => {
    if (value.type !== "custom") {
      setCustomFrom("");
      setCustomTo("");
    }
  };

  // Use same base classes as Input component for consistency
  const selectorButton = (
    <button
      type="button"
      className={cn(
        "w-full px-4 py-2 border border-border rounded-lg bg-surface hover:bg-surface-hover",
        "flex items-center justify-between text-base",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "text-text focus:outline-none focus:ring-2 focus:ring-primary"
      )}>
      <div className="flex items-center gap-2">
        <HiCalendar className="w-4 h-4 text-text-muted" />
        <span className="flex-1 text-left">{getDisplayText()}</span>
      </div>
      <HiChevronDown
        className={cn(
          "w-4 h-4 text-text-muted transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );

  return (
    <div className={cn("relative", className)}>
      <Dropdown
        dropdownSelector={selectorButton}
        open={isOpen}
        onOpenChange={setIsOpen}>
        <DropdownItem clicked={handleAllTime}>All Time</DropdownItem>
        <DropdownItem clicked={handleThisMonth}>This Month</DropdownItem>
        <DropdownItem clicked={handleLastMonth}>Last Month</DropdownItem>
        <DropdownItem
          clicked={handleCustomClick}
          className="flex-col items-start p-0">
          <div className="w-full p-2 hover:bg-surface-hover">
            Custom Date Range
          </div>
          <div className="w-full p-3 space-y-3 border-t border-border">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-text">
                From
              </label>
              <input
                type="date"
                value={customFrom}
                onChange={handleCustomFromChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-text">To</label>
              <input
                type="date"
                value={customTo}
                onChange={handleCustomToChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
