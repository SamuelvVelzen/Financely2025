export const SUBSCRIPTION_FREQUENCIES = [
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "biannual",
  "yearly",
] as const;

export type ISubscriptionFrequency = (typeof SUBSCRIPTION_FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<ISubscriptionFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Bi-weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannual: "Bi-annual",
  yearly: "Yearly",
};

/**
 * Expected interval ranges (in days) for each frequency.
 * Used by the detection algorithm to classify recurrence patterns.
 */
export const FREQUENCY_DAY_RANGES: Record<
  ISubscriptionFrequency,
  { min: number; max: number }
> = {
  weekly: { min: 5, max: 9 },
  biweekly: { min: 12, max: 17 },
  monthly: { min: 25, max: 35 },
  quarterly: { min: 80, max: 100 },
  biannual: { min: 170, max: 195 },
  yearly: { min: 350, max: 380 },
};
