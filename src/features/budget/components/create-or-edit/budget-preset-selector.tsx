"use client";

import {
  formatBudgetName,
  getCurrentMonthPreset,
  getCurrentYearPreset,
  getMonthlyPreset,
  getYearlyPreset,
  type IBudgetDateRange,
  type IBudgetPreset,
} from "@/features/budget/utils/budget-presets";
import { DateInput } from "@/features/ui/input/date-input";
import { RadioGroup, RadioItem } from "@/features/ui/radio";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { Label } from "@/features/ui/typography/label";
import { Text } from "@/features/ui/typography/text";
import { DateFormatHelpers } from "@/features/util/date/date-format.helpers";
import { LocaleHelpers } from "@/features/util/locale.helpers";
import { useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { HiCalendar, HiCalendarDays, HiCog6Tooth } from "react-icons/hi2";

type IBudgetPresetSelectorProps = {
  onPresetChange?: (preset: IBudgetPreset, dates: IBudgetDateRange) => void;
  onNameChange?: (name: string) => void;
};

/**
 * Format a date to YYYY-MM-DD string in local timezone
 * This avoids timezone conversion issues when using toISOString()
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date range for display
 */
function formatDateRangePreview(dates: IBudgetDateRange): string {
  const locale = LocaleHelpers.getLocale();

  // For monthly/yearly presets, use shorter format
  const startStr = DateFormatHelpers.formatIsoStringToString(
    dates.start.toISOString()
  );
  const endStr = DateFormatHelpers.formatIsoStringToString(
    dates.end.toISOString()
  );
  return `${startStr} - ${endStr}`;
}

export function BudgetPresetSelector({
  onPresetChange,
  onNameChange,
}: IBudgetPresetSelectorProps) {
  const form = useFormContext();
  const preset = form.watch("general.preset") as IBudgetPreset | undefined;
  const startDate = form.watch("general.startDate");
  const endDate = form.watch("general.endDate");
  const watchedYear = form.watch("general.year");
  const watchedMonth = form.watch("general.month");

  const handlePresetChange = (newPreset: IBudgetPreset) => {
    let dates: IBudgetDateRange;
    switch (newPreset) {
      case "monthly":
        dates = getCurrentMonthPreset();
        break;
      case "yearly":
        dates = getCurrentYearPreset();
        break;
      case "custom":
        // Keep existing dates or use current month
        dates =
          startDate && endDate
            ? { start: new Date(startDate), end: new Date(endDate) }
            : getCurrentMonthPreset();
        break;
    }

    form.setValue("general.startDate", formatLocalDate(dates.start));
    form.setValue("general.endDate", formatLocalDate(dates.end));

    const name = formatBudgetName(newPreset, dates);
    form.setValue("general.name", name);
    onNameChange?.(name);
    onPresetChange?.(newPreset, dates);
  };

  // Handle preset changes from RadioGroup
  const prevPresetRef = useRef<IBudgetPreset | undefined>(preset);
  useEffect(() => {
    if (preset && preset !== prevPresetRef.current) {
      prevPresetRef.current = preset;
      handlePresetChange(preset);
    }
  }, [preset, startDate, endDate]);

  const handleMonthChange = (year: number, month: number) => {
    const dates = getMonthlyPreset(year, month);
    form.setValue("general.startDate", formatLocalDate(dates.start));
    form.setValue("general.endDate", formatLocalDate(dates.end));
    const name = formatBudgetName("monthly", dates);
    form.setValue("general.name", name);
    onNameChange?.(name);
    onPresetChange?.("monthly", dates);
  };

  const handleYearChange = (year: number) => {
    const dates = getYearlyPreset(year);
    form.setValue("general.startDate", formatLocalDate(dates.start));
    form.setValue("general.endDate", formatLocalDate(dates.end));
    const name = formatBudgetName("yearly", dates);
    form.setValue("general.name", name);
    onNameChange?.(name);
    onPresetChange?.("yearly", dates);
  };

  // Trigger handlers when year/month changes for monthly/yearly presets
  useEffect(() => {
    if (preset === "monthly" && watchedYear && watchedMonth) {
      handleMonthChange(watchedYear, watchedMonth);
    }
  }, [preset, watchedYear, watchedMonth]);

  useEffect(() => {
    if (preset === "yearly" && watchedYear) {
      handleYearChange(Number(watchedYear));
    }
  }, [preset, watchedYear]);

  // Helper function to update name when custom dates change
  const handleCustomDateChange = (
    dateType: "start" | "end",
    newValue: string
  ) => {
    if (preset !== "custom") return;

    // Get the other date from form state before updating
    const otherStartDate = form.getValues("general.startDate");
    const otherEndDate = form.getValues("general.endDate");

    // Update the form field
    if (dateType === "start") {
      form.setValue("general.startDate", newValue, { shouldValidate: false });
    } else {
      form.setValue("general.endDate", newValue, { shouldValidate: false });
    }

    // Use the new value for the changed field, existing value for the other
    const currentStartDate = dateType === "start" ? newValue : otherStartDate;
    const currentEndDate = dateType === "end" ? newValue : otherEndDate;

    if (currentStartDate && currentEndDate) {
      // Parse dates in local timezone to avoid timezone conversion issues
      const parseLocalDate = (dateStr: string): Date => {
        const datePart = dateStr.split("T")[0]; // Get YYYY-MM-DD part only
        const [year, month, day] = datePart.split("-").map(Number);
        return new Date(year, month - 1, day); // Create date in local timezone
      };

      const dates: IBudgetDateRange = {
        start: parseLocalDate(currentStartDate),
        end: parseLocalDate(currentEndDate),
      };

      const name = formatBudgetName("custom", dates);
      form.setValue("general.name", name, { shouldValidate: false });
      onNameChange?.(name);
      onPresetChange?.("custom", dates);
    }
  };

  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // Parse date string manually to avoid timezone conversion issues
  // Date strings from form are in YYYY-MM-DD format
  const selectedStartDate = startDate
    ? (() => {
        const dateStr = startDate.split("T")[0]; // Get YYYY-MM-DD part only
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day); // Create date in local timezone
      })()
    : null;
  const selectedYear = selectedStartDate?.getFullYear() ?? currentYear;
  const selectedMonth = selectedStartDate
    ? selectedStartDate.getMonth() + 1
    : currentMonth;

  // Prepare options for selects
  const yearOptions = useMemo(
    () =>
      [currentYear - 1, currentYear, currentYear + 1].map((year) => ({
        value: year,
        label: String(year),
      })),
    [currentYear]
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => i + 1).map((month) => ({
        value: month,
        label: new Date(selectedYear, month - 1, 1).toLocaleString("default", {
          month: "long",
        }),
      })),
    [selectedYear]
  );

  // Get preview dates for each preset
  const monthlyPreview = useMemo(
    () => getMonthlyPreset(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );
  const yearlyPreview = useMemo(
    () => getYearlyPreset(selectedYear),
    [selectedYear]
  );
  const customPreview = useMemo(() => {
    if (startDate && endDate) {
      const parseLocalDate = (dateStr: string): Date => {
        const datePart = dateStr.split("T")[0];
        const [year, month, day] = datePart.split("-").map(Number);
        return new Date(year, month - 1, day);
      };
      return {
        start: parseLocalDate(startDate),
        end: parseLocalDate(endDate),
      };
    }
    return getCurrentMonthPreset();
  }, [startDate, endDate]);

  return (
    <div className="space-y-4">
      <RadioGroup
        name="general.preset"
        label="Budget Period"
        orientation="horizontal"
        className="mt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
          {/* Monthly Preset Card */}
          <RadioItem
            value="monthly"
            icon={HiCalendar}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text mb-1">Monthly</div>
              <Text
                size="sm"
                isMuted>
                {formatDateRangePreview(monthlyPreview)}
              </Text>
            </div>
          </RadioItem>

          {/* Yearly Preset Card */}
          <RadioItem
            value="yearly"
            icon={HiCalendarDays}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text mb-1">Yearly</div>
              <Text
                size="sm"
                isMuted>
                {formatDateRangePreview(yearlyPreview)}
              </Text>
            </div>
          </RadioItem>

          {/* Custom Preset Card */}
          <RadioItem
            value="custom"
            icon={HiCog6Tooth}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text mb-1">Custom</div>
              <Text
                size="sm"
                isMuted>
                {formatDateRangePreview(customPreview)}
              </Text>
            </div>
          </RadioItem>
        </div>
      </RadioGroup>

      {preset === "monthly" && (
        <div className="grid grid-cols-2 gap-4">
          <SelectDropdown
            name="general.year"
            label="Year"
            options={yearOptions}
            placeholder="Select year"
          />
          <SelectDropdown
            name="general.month"
            label="Month"
            options={monthOptions}
            placeholder="Select month"
          />
        </div>
      )}

      {preset === "yearly" && (
        <SelectDropdown
          name="general.year"
          label="Year"
          options={yearOptions}
          placeholder="Select year"
        />
      )}

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <DateInput
              name="general.startDate"
              onChange={(e) => {
                handleCustomDateChange("start", e.target.value);
              }}
            />
          </div>
          <div>
            <Label>End Date</Label>
            <DateInput
              name="general.endDate"
              onChange={(e) => {
                handleCustomDateChange("end", e.target.value);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
