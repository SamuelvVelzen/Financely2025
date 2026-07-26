/** Matches budget UI: Near Limit (≥80% and ≤100%), Over Budget (>100%). */
export const BUDGET_NEAR_LIMIT_PERCENT = 80;
export const BUDGET_OVER_LIMIT_PERCENT = 100;

export type IBudgetThresholdLevel = "near" | "over";

/**
 * Resolve expense-budget alert level from spent percentage.
 * Returns null when under the near-limit threshold.
 */
export function resolveBudgetThresholdLevel(
  percentage: number,
): IBudgetThresholdLevel | null {
  if (percentage > BUDGET_OVER_LIMIT_PERCENT) {
    return "over";
  }
  if (percentage >= BUDGET_NEAR_LIMIT_PERCENT) {
    return "near";
  }
  return null;
}
