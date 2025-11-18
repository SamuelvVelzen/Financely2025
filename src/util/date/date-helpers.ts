import {
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";

/**
 * Get start of current month as ISO string
 */
export function getCurrentMonthStart(): string {
  return startOfMonth(new Date()).toISOString();
}

/**
 * Get end of current month as ISO string
 */
export function getCurrentMonthEnd(): string {
  return endOfMonth(new Date()).toISOString();
}

/**
 * Get start of last month as ISO string
 */
export function getLastMonthStart(): string {
  return startOfMonth(subMonths(new Date(), 1)).toISOString();
}

/**
 * Get end of last month as ISO string
 */
export function getLastMonthEnd(): string {
  return endOfMonth(subMonths(new Date(), 1)).toISOString();
}

/**
 * Format date as "Month Year" (e.g., "January 2024")
 */
export function formatMonthYear(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "MMMM yyyy");
}

/**
 * Check if date is within range
 */
export function isDateInRange(
  date: Date | string,
  start: Date | string,
  end: Date | string
): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const startObj = typeof start === "string" ? parseISO(start) : start;
  const endObj = typeof end === "string" ? parseISO(end) : end;

  return isWithinInterval(dateObj, {
    start: startObj,
    end: endObj,
  });
}

/**
 * Get start and end dates for a specific month and year
 */
export function getMonthRange(
  month: number,
  year: number
): { start: string; end: string } {
  const date = new Date(year, month - 1, 1);
  return {
    start: startOfMonth(date).toISOString(),
    end: endOfMonth(date).toISOString(),
  };
}
