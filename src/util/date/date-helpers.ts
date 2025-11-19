import {
  endOfMonth,
  format,
  getYear,
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

/**
 * Format a date range intelligently using browser locale:
 * - If same year and current year: "January 15 - February 20"
 * - If same year but not current year: "January 15 - February 20, 2024"
 * - If different years: "December 15, 2023 - January 20, 2024"
 */
export function formatDateRange(from: string, to: string): string {
  try {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    const fromYear = getYear(fromDate);
    const toYear = getYear(toDate);
    const currentYear = getYear(new Date());

    // Get browser locale (defaults to 'en-US' if not available)
    const locale =
      typeof navigator !== "undefined"
        ? navigator.language || navigator.languages?.[0] || "en-US"
        : "en-US";

    // If same year
    if (fromYear === toYear) {
      // Format without year
      const dateFormatter = new Intl.DateTimeFormat(locale, {
        month: "long",
        day: "numeric",
      });
      const fromFormatted = dateFormatter.format(fromDate);
      const toFormatted = dateFormatter.format(toDate);

      // Only show year if it's not the current year
      if (fromYear === currentYear) {
        return `${fromFormatted} - ${toFormatted}`;
      } else {
        // Format year according to locale
        const yearFormatter = new Intl.NumberFormat(locale, {
          useGrouping: false,
        });
        const yearFormatted = yearFormatter.format(fromYear);
        return `${fromFormatted} - ${toFormatted}, ${yearFormatted}`;
      }
    } else {
      // Different years, show year with each date
      const dateFormatter = new Intl.DateTimeFormat(locale, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const fromFormatted = dateFormatter.format(fromDate);
      const toFormatted = dateFormatter.format(toDate);
      return `${fromFormatted} - ${toFormatted}`;
    }
  } catch {
    // Fallback to old format if parsing fails
    return `${formatMonthYear(from)} - ${formatMonthYear(to)}`;
  }
}
