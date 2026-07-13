import type { ISplitExpense } from "@/features/split/offline/split-offline-optimistic";
import { formatDateHeader } from "@/features/util/date/date-helpers";
import { parseISO } from "date-fns";

export type ISplitExpenseDateGroup = {
  date: string;
  dateHeader: string;
  expenses: ISplitExpense[];
};

export function groupSplitExpensesByDate(
  expenses: ISplitExpense[],
): ISplitExpenseDateGroup[] {
  const dateMap = new Map<string, ISplitExpense[]>();

  for (const expense of expenses) {
    const dateKey = parseISO(expense.expenseDate).toISOString().split("T")[0]!;
    const bucket = dateMap.get(dateKey);
    if (bucket) {
      bucket.push(expense);
    } else {
      dateMap.set(dateKey, [expense]);
    }
  }

  return Array.from(dateMap.entries())
    .map(([dateKey, groupExpenses]) => {
      const dateObj = parseISO(`${dateKey}T00:00:00.000Z`);
      return {
        date: dateKey,
        dateHeader: formatDateHeader(dateObj),
        expenses: groupExpenses.toSorted(
          (a, b) =>
            new Date(b.expenseDate).getTime() -
            new Date(a.expenseDate).getTime(),
        ),
      };
    })
    .toSorted((a, b) => b.date.localeCompare(a.date));
}
