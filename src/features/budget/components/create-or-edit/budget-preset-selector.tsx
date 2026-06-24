import { resyncBudgetItemMonthlyAmounts } from "@/features/budget/utils/budget-form-transform";
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
import { useEffect, useMemo, useRef } from "react";
import { useFormContext } from "react-hook-form";
import {
  HiCalendar,
  HiCalendarDays,
  HiCog6Tooth,
  HiTableCells,
} from "react-icons/hi2";

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

function formatDateRangePreview(dates: IBudgetDateRange): string {
  const fmt: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  return `${dates.start.toLocaleDateString("default", fmt)} – ${dates.end.toLocaleDateString("default", fmt)}`;
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
      case "yearly-per-month":
        dates = getCurrentYearPreset();
        break;
      case "custom":
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
    resyncBudgetItemMonthlyAmounts(form);
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
    resyncBudgetItemMonthlyAmounts(form);
  };

  const handleYearChange = (year: number) => {
    const dates = getYearlyPreset(year);
    form.setValue("general.startDate", formatLocalDate(dates.start));
    form.setValue("general.endDate", formatLocalDate(dates.end));
    const presetForName = preset === "yearly-per-month" ? "yearly-per-month" : "yearly";
    const name = formatBudgetName(presetForName, dates);
    form.setValue("general.name", name);
    onNameChange?.(name);
    onPresetChange?.(presetForName, dates);
    resyncBudgetItemMonthlyAmounts(form);
  };

  // Trigger handlers when year/month changes for monthly/yearly presets
  useEffect(() => {
    if (preset === "monthly" && watchedYear && watchedMonth) {
      handleMonthChange(watchedYear, watchedMonth);
    }
  }, [preset, watchedYear, watchedMonth]);

  useEffect(() => {
    if ((preset === "yearly" || preset === "yearly-per-month") && watchedYear) {
      handleYearChange(Number(watchedYear));
    }
  }, [preset, watchedYear]);

  const handleCustomDateChange = () => {
    if (preset !== "custom") return;

    const currentStartDate = form.getValues("general.startDate");
    const currentEndDate = form.getValues("general.endDate");

    if (currentStartDate && currentEndDate) {
      const parseLocalDate = (dateStr: string): Date => {
        const datePart = dateStr.split("T")[0];
        const [year, month, day] = datePart.split("-").map(Number);
        return new Date(year, month - 1, day);
      };

      const dates: IBudgetDateRange = {
        start: parseLocalDate(currentStartDate),
        end: parseLocalDate(currentEndDate),
      };

      const name = formatBudgetName("custom", dates);
      form.setValue("general.name", name, { shouldValidate: false });
      onNameChange?.(name);
      onPresetChange?.("custom", dates);
      resyncBudgetItemMonthlyAmounts(form);
    }
  };

  const currentDate = useMemo(() => new Date(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const selectedStartDate = startDate
    ? (() => {
      const dateStr = startDate.split("T")[0];
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    })()
    : null;
  const selectedYear = selectedStartDate?.getFullYear() ?? currentYear;
  const selectedMonth = selectedStartDate
    ? selectedStartDate.getMonth() + 1
    : currentMonth;

  const MIN_YEAR = currentYear - 10;
  const MAX_YEAR = currentYear + 50;

  const yearOptions = useMemo(
    () =>
      Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => {
        const year = MIN_YEAR + i;
        return { value: year, label: String(year) };
      }),
    [MIN_YEAR, MAX_YEAR]
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <RadioItem value="monthly" icon={HiCalendar}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text">Monthly</div>
              <Text size="xs" isMuted>
                {formatDateRangePreview(monthlyPreview)}
              </Text>
            </div>
          </RadioItem>

          <RadioItem value="yearly" icon={HiCalendarDays}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text">Yearly</div>
              <Text size="xs" isMuted>
                {formatDateRangePreview(yearlyPreview)}
              </Text>
            </div>
          </RadioItem>

          <RadioItem value="yearly-per-month" icon={HiTableCells}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text">Yearly (Monthly)</div>
              <Text size="xs" isMuted>
                {formatDateRangePreview(yearlyPreview)}
              </Text>
            </div>
          </RadioItem>

          <RadioItem value="custom" icon={HiCog6Tooth}>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-text">Custom</div>
              <Text size="xs" isMuted>
                {formatDateRangePreview(customPreview)}
              </Text>
            </div>
          </RadioItem>
        </div>
      </RadioGroup>

      {preset === "monthly" && (
        <div className="grid grid-cols-2 gap-4">
          <SelectDropdown<number>
            name="general.year"
            label="Year"
            options={yearOptions}
            placeholder={`e.g. ${currentYear}`}
            clearable={false}
          />
          <SelectDropdown<number>
            name="general.month"
            label="Month"
            options={monthOptions}
            placeholder="Select month"
            clearable={false}
          />
        </div>
      )}

      {(preset === "yearly" || preset === "yearly-per-month") && (
        <SelectDropdown<number>
          name="general.year"
          label="Year"
          options={yearOptions}
          placeholder={`e.g. ${currentYear}`}
          clearable={false}
        />
      )}

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <DateInput
              name="general.startDate"
              mode="dateOnly"
              onValueChange={handleCustomDateChange}
            />
          </div>
          <div>
            <Label>End Date</Label>
            <DateInput
              name="general.endDate"
              mode="dateOnly"
              onValueChange={handleCustomDateChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
