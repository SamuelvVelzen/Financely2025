import type { INotificationAction } from "@/features/shared/validation/schemas";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { NotificationService } from "./notification.service";

/**
 * Notification Factory
 * Helper functions for creating common notification types (workspace-scoped).
 */
export class NotificationFactory {
  static async createSubscriptionFoundNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    count: number,
  ): Promise<void> {
    const actions: INotificationAction[] = [
      {
        label: "View Subscriptions",
        type: "navigate",
        path: `/${workspaceId}/subscriptions`,
        variant: "primary",
      },
      {
        label: "Dismiss",
        type: "dismiss",
        variant: "default",
      },
    ];

    await NotificationService.createNotification(userId, workspaceId, {
      title: "Subscriptions Found",
      content: `We found ${count} potential subscription${count !== 1 ? "s" : ""} in your transactions.`,
      type: "INFO",
      actions,
    });
  }

  static async createExpenseAlertNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    currentAmount: number,
    previousAmount: number,
    currency: string = "USD",
  ): Promise<void> {
    const percentage = Math.round(
      ((currentAmount - previousAmount) / previousAmount) * 100,
    );

    const actions: INotificationAction[] = [
      {
        label: "View Transactions",
        type: "navigate",
        path: `/${workspaceId}/transactions`,
        variant: "primary",
      },
      {
        label: "Dismiss",
        type: "dismiss",
        variant: "default",
      },
    ];

    await NotificationService.createNotification(userId, workspaceId, {
      title: "High Monthly Expenses",
      content: `Your expenses this month (${currency} ${currentAmount.toFixed(2)}) are ${percentage}% higher than last month (${currency} ${previousAmount.toFixed(2)}).`,
      type: "WARNING",
      actions,
    });
  }

  static async createTransactionImportNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    successCount: number,
    failureCount: number,
    importId?: string,
  ): Promise<void> {
    const actions: INotificationAction[] = [
      {
        label: "View Transactions",
        type: "navigate",
        path: `/${workspaceId}/transactions`,
        variant: "primary",
      },
      {
        label: "Dismiss",
        type: "dismiss",
        variant: "default",
      },
    ];

    let content = `Successfully imported ${successCount} transaction${successCount !== 1 ? "s" : ""}.`;
    if (failureCount > 0) {
      content += ` ${failureCount} transaction${failureCount !== 1 ? "s" : ""} failed to import.`;
    }

    await NotificationService.createNotification(userId, workspaceId, {
      title: "Import Complete",
      content,
      type: failureCount > 0 ? "WARNING" : "SUCCESS",
      actions,
      relatedId: importId,
      relatedType: "import",
    });
  }

  static async createSystemNotification(
    userId: string,
    workspaceId: IWorkspaceId,
    title: string,
    content: string,
    type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" = "INFO",
    actions?: INotificationAction[],
  ): Promise<void> {
    await NotificationService.createNotification(userId, workspaceId, {
      title,
      content,
      type,
      actions: actions || [
        {
          label: "Dismiss",
          type: "dismiss",
          variant: "default",
        },
      ],
    });
  }
}
