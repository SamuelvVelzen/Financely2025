/**
 * Budget Preset Utilities
 * Helper functions for generating common budget date ranges
 */

export type IBudgetPreset = "monthly" | "yearly" | "custom";

export interface IBudgetDateRange {
  start: Date;
  end: Date;
}

/**
 * Get date range for a specific month
 */
export function getMonthlyPreset(
  year: number,
  month: number
): IBudgetDateRange {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

  return { start, end };
}

/**
 * Get date range for a specific year
 */
export function getYearlyPreset(year: number): IBudgetDateRange {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999); // Last day of December

  return { start, end };
}

/**
 * Get current month's date range
 */
export function getCurrentMonthPreset(): IBudgetDateRange {
  const now = new Date();
  return getMonthlyPreset(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Get current year's date range
 */
export function getCurrentYearPreset(): IBudgetDateRange {
  const now = new Date();
  return getYearlyPreset(now.getFullYear());
}

/**
 * Get next month's date range
 */
export function getNextMonthPreset(): IBudgetDateRange {
  const now = new Date();
  const nextMonth = now.getMonth() + 1;
  const year = nextMonth === 12 ? now.getFullYear() + 1 : now.getFullYear();
  const month = nextMonth === 12 ? 1 : nextMonth;

  return getMonthlyPreset(year, month);
}

/**
 * Get next year's date range
 */
export function getNextYearPreset(): IBudgetDateRange {
  const now = new Date();
  return getYearlyPreset(now.getFullYear() + 1);
}

/**
 * Format budget name based on preset type and dates
 */
export function formatBudgetName(
  preset: IBudgetPreset,
  dates: IBudgetDateRange
): string {
  if (preset === "monthly") {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = monthNames[dates.start.getMonth()];
    const year = dates.start.getFullYear();
    return `${month} ${year} Budget`;
  }

  if (preset === "yearly") {
    return `${dates.start.getFullYear()} Budget`;
  }

  // Custom - use date range
  const startStr = dates.start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endStr = dates.end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr} - ${endStr} Budget`;
}

