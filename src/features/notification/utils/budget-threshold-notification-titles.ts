export const BUDGET_NEAR_LIMIT_TITLE = "Budget near limit";
export const BUDGET_OVER_LIMIT_TITLE = "Budget over limit";

export function budgetThresholdTitle(
  level: "near" | "over",
): typeof BUDGET_NEAR_LIMIT_TITLE | typeof BUDGET_OVER_LIMIT_TITLE {
  return level === "over" ? BUDGET_OVER_LIMIT_TITLE : BUDGET_NEAR_LIMIT_TITLE;
}
