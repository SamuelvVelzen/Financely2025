import { uniquePreserveOrder } from "@/features/currency/config/currencies";

/**
 * Recommended currencies when adding a split expense:
 * group settlement currency first, then currencies already used on this trip.
 */
export function getSplitExpenseRecommendedCurrencies(
  groupCurrency: string,
  expenses: Array<{ currency: string }>,
): string[] {
  return uniquePreserveOrder([
    groupCurrency,
    ...expenses.map((expense) => expense.currency),
  ]);
}
