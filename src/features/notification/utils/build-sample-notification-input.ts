import type { INotificationType } from "@/features/shared/validation/enums";
import type { ICreateNotificationInput } from "@/features/shared/validation/schemas";
import { NOTIFICATION_RELATED_TYPE } from "./notification-related-type";

const SAMPLE_BY_TYPE: Record<INotificationType, ICreateNotificationInput> = {
  INFO: {
    title: "Subscriptions Found",
    content:
      "We found 3 potential subscriptions in your transactions. Review them to stay on top of recurring charges.",
    type: "INFO",
    relatedType: NOTIFICATION_RELATED_TYPE.subscription,
  },
  SUCCESS: {
    title: "Import Complete",
    content: "Successfully imported 42 transactions from your CSV file.",
    type: "SUCCESS",
    relatedType: NOTIFICATION_RELATED_TYPE.import,
  },
  WARNING: {
    title: "High Monthly Expenses",
    content:
      "Your expenses this month (USD 1,240.00) are 55% higher than last month (USD 800.00).",
    type: "WARNING",
    relatedType: NOTIFICATION_RELATED_TYPE.transactions,
  },
  ERROR: {
    title: "Sync Failed",
    content:
      "We couldn't sync your latest bank feed. Check your connection and try again.",
    type: "ERROR",
  },
};

export function buildSampleNotificationInput(
  type: INotificationType,
): ICreateNotificationInput {
  return SAMPLE_BY_TYPE[type];
}

/** Diverse samples for filter/search testing (one of each type + extras). */
export function buildSampleNotificationPack(): ICreateNotificationInput[] {
  return [
    buildSampleNotificationInput("INFO"),
    buildSampleNotificationInput("SUCCESS"),
    buildSampleNotificationInput("WARNING"),
    buildSampleNotificationInput("ERROR"),
    {
      title: "Budget almost reached",
      content:
        "You've used 92% of your Food & Dining budget for this month. Consider adjusting spending.",
      type: "WARNING",
      relatedType: NOTIFICATION_RELATED_TYPE.budget,
    },
    {
      title: "Welcome to notifications",
      content:
        "This is a plain info note with no actions — useful for testing the minimal layout.",
      type: "INFO",
    },
  ];
}
