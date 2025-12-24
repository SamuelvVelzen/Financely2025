import type { ICreateMessageInput, IMessageAction } from "@/features/shared/validation/schemas";
import { MessageService } from "./message.service";

/**
 * Message Factory
 * Helper functions for creating common message types
 */
export class MessageFactory {
  /**
   * Create a subscription found message
   */
  static async createSubscriptionFoundMessage(
    userId: string,
    count: number
  ): Promise<void> {
    const actions: IMessageAction[] = [
      {
        label: "View Subscriptions",
        type: "navigate",
        path: "/subscriptions",
        variant: "primary",
      },
      {
        label: "Dismiss",
        type: "dismiss",
        variant: "secondary",
      },
    ];

    await MessageService.createMessage(userId, {
      title: "Subscriptions Found",
      content: `We found ${count} potential subscription${count !== 1 ? "s" : ""} in your transactions.`,
      type: "INFO",
      actions,
    });
  }

  /**
   * Create an expense alert message
   */
  static async createExpenseAlertMessage(
    userId: string,
    currentAmount: number,
    previousAmount: number,
    currency: string = "USD"
  ): Promise<void> {
    const percentage = Math.round(
      ((currentAmount - previousAmount) / previousAmount) * 100
    );

    const actions: IMessageAction[] = [
      {
        label: "View Expenses",
        type: "navigate",
        path: "/expenses",
        variant: "primary",
      },
      {
        label: "Dismiss",
        type: "dismiss",
        variant: "secondary",
      },
    ];

    await MessageService.createMessage(userId, {
      title: "High Monthly Expenses",
      content: `Your expenses this month (${currency} ${currentAmount.toFixed(2)}) are ${percentage}% higher than last month (${currency} ${previousAmount.toFixed(2)}).`,
      type: "WARNING",
      actions,
    });
  }

  /**
   * Create a transaction import success message
   */
  static async createTransactionImportMessage(
    userId: string,
    successCount: number,
    failureCount: number,
    importId?: string
  ): Promise<void> {
    const actions: IMessageAction[] = [
      {
        label: "View Transactions",
        type: "navigate",
        path: "/expenses",
        variant: "primary",
      },
      {
        label: "Dismiss",
        type: "dismiss",
        variant: "secondary",
      },
    ];

    let content = `Successfully imported ${successCount} transaction${successCount !== 1 ? "s" : ""}.`;
    if (failureCount > 0) {
      content += ` ${failureCount} transaction${failureCount !== 1 ? "s" : ""} failed to import.`;
    }

    await MessageService.createMessage(userId, {
      title: "Import Complete",
      content,
      type: failureCount > 0 ? "WARNING" : "SUCCESS",
      actions,
      relatedId: importId,
      relatedType: "import",
    });
  }

  /**
   * Create a generic system message
   */
  static async createSystemMessage(
    userId: string,
    title: string,
    content: string,
    type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" = "INFO",
    actions?: IMessageAction[]
  ): Promise<void> {
    await MessageService.createMessage(userId, {
      title,
      content,
      type,
      actions: actions || [
        {
          label: "Dismiss",
          type: "dismiss",
          variant: "secondary",
        },
      ],
    });
  }
}

