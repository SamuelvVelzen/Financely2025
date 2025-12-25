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
import { Button } from "@/features/ui/button/button";
import { DateInput } from "@/features/ui/input/date-input";
import { Label } from "@/features/ui/typography/label";
import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";

type IBudgetPresetSelectorProps = {
  onPresetChange?: (preset: IBudgetPreset, dates: IBudgetDateRange) => void;
  onNameChange?: (name: string) => void;
};

export function BudgetPresetSelector({
  onPresetChange,
  onNameChange,
}: IBudgetPresetSelectorProps) {
  const form = useFormContext();
  const preset = form.watch("preset") as IBudgetPreset | undefined;
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  const handlePresetChange = (newPreset: IBudgetPreset) => {
    form.setValue("preset", newPreset);

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

    form.setValue("startDate", dates.start.toISOString().split("T")[0]);
    form.setValue("endDate", dates.end.toISOString().split("T")[0]);

    const name = formatBudgetName(newPreset, dates);
    form.setValue("name", name);
    onNameChange?.(name);
    onPresetChange?.(newPreset, dates);
  };

  const handleMonthChange = (year: number, month: number) => {
    const dates = getMonthlyPreset(year, month);
    form.setValue("startDate", dates.start.toISOString().split("T")[0]);
    form.setValue("endDate", dates.end.toISOString().split("T")[0]);
    const name = formatBudgetName("monthly", dates);
    form.setValue("name", name);
    onNameChange?.(name);
    onPresetChange?.("monthly", dates);
  };

  const handleYearChange = (year: number) => {
    const dates = getYearlyPreset(year);
    form.setValue("startDate", dates.start.toISOString().split("T")[0]);
    form.setValue("endDate", dates.end.toISOString().split("T")[0]);
    const name = formatBudgetName("yearly", dates);
    form.setValue("name", name);
    onNameChange?.(name);
    onPresetChange?.("yearly", dates);
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

  return (
    <div className="space-y-4">
      <div>
        <Label>Budget Period</Label>
        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant={preset === "monthly" ? "primary" : "secondary"}
            clicked={() => handlePresetChange("monthly")}
            className="flex-1">
            Monthly
          </Button>
          <Button
            type="button"
            variant={preset === "yearly" ? "primary" : "secondary"}
            clicked={() => handlePresetChange("yearly")}
            className="flex-1">
            Yearly
          </Button>
          <Button
            type="button"
            variant={preset === "custom" ? "primary" : "secondary"}
            clicked={() => handlePresetChange("custom")}
            className="flex-1">
            Custom
          </Button>
        </div>
      </div>

      {preset === "monthly" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Year</Label>
            <Controller
              name="year"
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  onChange={(e) => {
                    const year = parseInt(e.target.value);
                    field.onChange(year);
                    handleMonthChange(year, selectedMonth);
                  }}
                  value={selectedYear}>
                  {[currentYear - 1, currentYear, currentYear + 1].map(
                    (year) => (
                      <option
                        key={year}
                        value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              )}
            />
          </div>
          <div>
            <Label>Month</Label>
            <Controller
              name="month"
              control={form.control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  onChange={(e) => {
                    const month = parseInt(e.target.value);
                    field.onChange(month);
                    handleMonthChange(selectedYear, month);
                  }}
                  value={selectedMonth}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option
                      key={month}
                      value={month}>
                      {new Date(selectedYear, month - 1, 1).toLocaleString(
                        "default",
                        {
                          month: "long",
                        }
                      )}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>
      )}

      {preset === "yearly" && (
        <div>
          <Label>Year</Label>
          <Controller
            name="year"
            control={form.control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                onChange={(e) => {
                  const year = parseInt(e.target.value);
                  field.onChange(year);
                  handleYearChange(year);
                }}
                value={selectedYear}>
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <option
                    key={year}
                    value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      )}

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <DateInput name="startDate" />
          </div>
          <div>
            <Label>End Date</Label>
            <DateInput name="endDate" />
          </div>
        </div>
      )}
    </div>
  );
}
