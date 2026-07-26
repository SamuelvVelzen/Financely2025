import type { INotificationType } from "@/features/shared/validation/enums";
import type { ICreateNotificationInput } from "@/features/shared/validation/schemas";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

const SAMPLE_BY_TYPE: Record<
  INotificationType,
  Omit<ICreateNotificationInput, "actions">
> = {
  INFO: {
    title: "Subscriptions Found",
    content:
      "We found 3 potential subscriptions in your transactions. Review them to stay on top of recurring charges.",
    type: "INFO",
    relatedType: "subscription",
  },
  SUCCESS: {
    title: "Import Complete",
    content: "Successfully imported 42 transactions from your CSV file.",
    type: "SUCCESS",
    relatedType: "import",
  },
  WARNING: {
    title: "High Monthly Expenses",
    content:
      "Your expenses this month (USD 1,240.00) are 55% higher than last month (USD 800.00).",
    type: "WARNING",
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
  workspaceId: IWorkspaceId,
): ICreateNotificationInput {
  const sample = SAMPLE_BY_TYPE[type];
  const viewPath =
    type === "INFO"
      ? `/${workspaceId}/subscriptions`
      : `/${workspaceId}/transactions`;

  return {
    ...sample,
    actions: [
      {
        label: type === "INFO" ? "View Subscriptions" : "View Transactions",
        type: "navigate",
        path: viewPath,
        variant: "primary",
      },
    ],
  };
}

/** Diverse samples for filter/search testing (one of each type + extras). */
export function buildSampleNotificationPack(
  workspaceId: IWorkspaceId,
): ICreateNotificationInput[] {
  return [
    buildSampleNotificationInput("INFO", workspaceId),
    buildSampleNotificationInput("SUCCESS", workspaceId),
    buildSampleNotificationInput("WARNING", workspaceId),
    buildSampleNotificationInput("ERROR", workspaceId),
    {
      title: "Budget almost reached",
      content:
        "You've used 92% of your Food & Dining budget for this month. Consider adjusting spending.",
      type: "WARNING",
      actions: [
        {
          label: "View Budget",
          type: "navigate",
          path: `/${workspaceId}/budgets`,
          variant: "primary",
        },
      ],
    },
    {
      title: "Welcome to notifications",
      content:
        "This is a plain info note with no actions — useful for testing the minimal layout.",
      type: "INFO",
    },
  ];
}
