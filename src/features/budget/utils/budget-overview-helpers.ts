/**
 * Budget Overview Helper Functions
 * Utility functions for calculating budget overview metrics
 */

/**
 * Calculate days remaining until a date
 */
export function calculateDaysRemaining(endDate: Date): number {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate spending pace compared to expected pace
 * @param actual - Actual amount spent
 * @param expected - Expected total amount
 * @param daysElapsed - Days since budget started
 * @param totalDays - Total days in budget period
 * @returns 'faster' if spending faster than expected, 'slower' if slower, 'on-track' if similar
 */
export function calculateSpendingPace(
  actual: number,
  expected: number,
  daysElapsed: number,
  totalDays: number
): "faster" | "slower" | "on-track" {
  if (daysElapsed === 0 || totalDays === 0 || expected === 0) {
    return "on-track";
  }

  const expectedPace = (expected / totalDays) * daysElapsed;
  const actualPace = actual;
  const variance = actualPace - expectedPace;
  const variancePercentage = (variance / expectedPace) * 100;

  // If variance is less than 5%, consider it on-track
  if (Math.abs(variancePercentage) < 5) {
    return "on-track";
  }

  return variance > 0 ? "faster" : "slower";
}

/**
 * Get status color based on percentage used
 * @param percentage - Percentage of budget used (0-100+)
 * @returns CSS class name for text color
 */
export function getStatusColor(percentage: number): string {
  if (percentage < 80) return "text-text";
  if (percentage <= 100) return "text-warning";
  return "text-danger";
}

/**
 * Format remaining amount with currency
 * @param remaining - Remaining amount (can be negative if over budget)
 * @param currency - Currency code
 * @returns Formatted string like "€420 left" or "€200 over"
 */
export function formatRemaining(remaining: number, currency: string): string {
  const absRemaining = Math.abs(remaining);
  const formatted = absRemaining.toLocaleString(undefined, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (remaining < 0) {
    return `${formatted} over`;
  }
  return `${formatted} left`;
}

