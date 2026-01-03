import type { ITransaction } from "@/features/shared/validation/schemas";
import { formatDateHeader } from "@/features/util/date/date-helpers";
import { parseISO } from "date-fns";

export interface IDateGroup {
  date: string; // ISO date string (date portion only)
  dateHeader: string; // Formatted header (e.g., "Today", "Yesterday", "January 15, 2024")
  transactions: ITransaction[];
}

/**
 * Group transactions by date
 * - Uses transactionDate (authoritative calendar date) for grouping
 * - Groups transactions into date buckets
 * - Sorts dates descending (most recent first)
 * - Formats date headers intelligently
 * - Uses precision-aware sorting within groups
 */
export function groupTransactionsByDate(
  transactions: ITransaction[]
): IDateGroup[] {
  // Group transactions by transactionDate (authoritative calendar date)
  const dateMap = new Map<string, ITransaction[]>();

  for (const transaction of transactions) {
    const dateObj = parseISO(transaction.transactionDate);
    // Create a date-only key (YYYY-MM-DD)
    const dateKey = dateObj.toISOString().split("T")[0];

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, []);
    }
    dateMap.get(dateKey)!.push(transaction);
  }

  // Convert map to array and sort by date (descending - most recent first)
  const dateGroups: IDateGroup[] = Array.from(dateMap.entries())
    .map(([dateKey, transactions]) => {
      // Create a full ISO datetime for the date (midnight UTC)
      const dateObj = parseISO(dateKey + "T00:00:00.000Z");
      return {
        date: dateKey,
        dateHeader: formatDateHeader(dateObj),
        transactions: transactions.sort((a, b) => {
          // Precision-aware sorting within group (R13)
          // Primary: transactionDate (should be same, but ensure consistency)
          const dateCompare =
            new Date(b.transactionDate).getTime() -
            new Date(a.transactionDate).getTime();
          if (dateCompare !== 0) return dateCompare;

          // Secondary: precision-aware
          if (
            a.timePrecision === "DateTime" &&
            b.timePrecision === "DateTime"
          ) {
            // Both have time: sort by transactionDate time (most recent first)
            return (
              new Date(b.transactionDate).getTime() -
              new Date(a.transactionDate).getTime()
            );
          } else if (
            a.timePrecision === "DateOnly" &&
            b.timePrecision === "DateOnly"
          ) {
            // Both date-only: sort by createdAt (stable tie-breaker, most recent first)
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          } else {
            // Mixed: DateTime comes before DateOnly (more precise first)
            return a.timePrecision === "DateTime" ? -1 : 1;
          }
        }),
      };
    })
    .sort((a, b) => {
      // Sort groups by date (descending - most recent first)
      return b.date.localeCompare(a.date);
    });

  return dateGroups;
}
