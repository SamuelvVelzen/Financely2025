/**
 * Semantic related-entity keys for notifications.
 * UI derives CTAs from these — do not store button labels in the DB.
 */
export const NOTIFICATION_RELATED_TYPE = {
  subscription: "subscription",
  import: "import",
  transactions: "transactions",
  budget: "budget",
} as const;

export type INotificationRelatedType =
  (typeof NOTIFICATION_RELATED_TYPE)[keyof typeof NOTIFICATION_RELATED_TYPE];

export function isNotificationRelatedType(
  value: string | null | undefined,
): value is INotificationRelatedType {
  if (!value) {
    return false;
  }
  return Object.values(NOTIFICATION_RELATED_TYPE).includes(
    value as INotificationRelatedType,
  );
}
