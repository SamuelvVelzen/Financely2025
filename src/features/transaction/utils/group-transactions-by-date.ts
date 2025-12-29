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
 * - Extracts date portion from ISO datetime strings
 * - Groups transactions into date buckets
 * - Sorts dates descending (most recent first)
 * - Formats date headers intelligently
 */
export function groupTransactionsByDate(
  transactions: ITransaction[]
): IDateGroup[] {
  // Group transactions by date (date portion only, ignoring time)
  const dateMap = new Map<string, ITransaction[]>();

  for (const transaction of transactions) {
    const dateObj = parseISO(transaction.occurredAt);
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
          // Sort transactions within group by time (most recent first)
          return (
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
          );
        }),
      };
    })
    .sort((a, b) => {
      // Sort groups by date (descending - most recent first)
      return b.date.localeCompare(a.date);
    });

  return dateGroups;
}
