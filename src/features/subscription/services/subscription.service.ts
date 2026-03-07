import {
  ConfirmSubscriptionInputSchema,
  DismissSubscriptionCandidateInputSchema,
  SubscriptionDismissalsResponseSchema,
  SubscriptionSchema,
  SubscriptionsQuerySchema,
  SubscriptionsResponseSchema,
  UpdateSubscriptionInputSchema,
  type IConfirmSubscriptionInput,
  type IDismissSubscriptionCandidateInput,
  type ISubscription,
  type ISubscriptionDismissalsResponse,
  type ISubscriptionsQuery,
  type ISubscriptionsResponse,
  type IUpdateSubscriptionInput,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";

export class SubscriptionService {
  /**
   * Confirm a detected subscription: create Subscription record and link transactions.
   */
  static async confirmSubscription(
    userId: string,
    input: IConfirmSubscriptionInput,
  ): Promise<ISubscription> {
    const validated = ConfirmSubscriptionInputSchema.parse(input);

    const txCount = await prisma.transaction.count({
      where: {
        id: { in: validated.transactionIds },
        userId,
      },
    });

    if (txCount !== validated.transactionIds.length) {
      throw new Error("One or more transactions not found");
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        name: validated.name,
        type: validated.type,
        amount: validated.amount,
        currency: validated.currency,
        frequency: validated.frequency,
        active: true,
      },
    });

    await prisma.transaction.updateMany({
      where: {
        id: { in: validated.transactionIds },
        userId,
      },
      data: {
        subscriptionId: subscription.id,
      },
    });

    const withTransactions = await prisma.subscription.findUnique({
      where: { id: subscription.id },
      include: {
        transactions: {
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            transactionDate: true,
            type: true,
          },
          orderBy: { transactionDate: "desc" },
        },
      },
    });

    return this.parseSubscription(withTransactions!);
  }

  /**
   * List all subscriptions for a user.
   */
  static async listSubscriptions(
    userId: string,
    query?: ISubscriptionsQuery,
  ): Promise<ISubscriptionsResponse> {
    const validated = query
      ? SubscriptionsQuerySchema.parse(query)
      : {};

    const where: Record<string, unknown> = { userId };
    if (validated.active !== undefined) {
      where.active = validated.active;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        transactions: {
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            transactionDate: true,
            type: true,
          },
          orderBy: { transactionDate: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return SubscriptionsResponseSchema.parse({
      data: subscriptions.map((s) => this.parseSubscription(s)),
    });
  }

  /**
   * Get a single subscription by ID.
   */
  static async getSubscriptionById(
    userId: string,
    subscriptionId: string,
  ): Promise<ISubscription | null> {
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      include: {
        transactions: {
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            transactionDate: true,
            type: true,
          },
          orderBy: { transactionDate: "desc" },
        },
      },
    });

    if (!subscription) return null;

    return this.parseSubscription(subscription);
  }

  /**
   * Update a subscription.
   */
  static async updateSubscription(
    userId: string,
    subscriptionId: string,
    input: IUpdateSubscriptionInput,
  ): Promise<ISubscription> {
    const validated = UpdateSubscriptionInputSchema.parse(input);

    const existing = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!existing) {
      throw new Error("Subscription not found");
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.active !== undefined && { active: validated.active }),
        ...(validated.frequency !== undefined && {
          frequency: validated.frequency,
        }),
        ...(validated.amount !== undefined && { amount: validated.amount }),
      },
      include: {
        transactions: {
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            transactionDate: true,
            type: true,
          },
          orderBy: { transactionDate: "desc" },
        },
      },
    });

    return this.parseSubscription(updated);
  }

  /**
   * Delete a subscription and unlink its transactions.
   */
  static async deleteSubscription(
    userId: string,
    subscriptionId: string,
  ): Promise<void> {
    const existing = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
    });

    if (!existing) {
      throw new Error("Subscription not found");
    }

    await prisma.transaction.updateMany({
      where: { subscriptionId },
      data: { subscriptionId: null },
    });

    await prisma.subscription.delete({
      where: { id: subscriptionId },
    });
  }

  /**
   * Dismiss a subscription candidate so it won't be suggested again.
   */
  static async dismissCandidate(
    userId: string,
    input: IDismissSubscriptionCandidateInput,
  ): Promise<void> {
    const validated =
      DismissSubscriptionCandidateInputSchema.parse(input);

    await prisma.subscriptionDismissal.upsert({
      where: {
        userId_normalizedName_type: {
          userId,
          normalizedName: validated.normalizedName,
          type: validated.type,
        },
      },
      update: {},
      create: {
        userId,
        normalizedName: validated.normalizedName,
        type: validated.type,
      },
    });
  }

  /**
   * List all dismissed subscription candidates for a user.
   */
  static async listDismissals(
    userId: string,
  ): Promise<ISubscriptionDismissalsResponse> {
    const dismissals = await prisma.subscriptionDismissal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return SubscriptionDismissalsResponseSchema.parse({
      data: dismissals.map((d) => ({
        id: d.id,
        normalizedName: d.normalizedName,
        type: d.type,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  }

  /**
   * Remove a dismissal so the candidate can be detected again.
   */
  static async undismissCandidate(
    userId: string,
    dismissalId: string,
  ): Promise<void> {
    const existing = await prisma.subscriptionDismissal.findFirst({
      where: { id: dismissalId, userId },
    });

    if (!existing) {
      throw new Error("Dismissal not found");
    }

    await prisma.subscriptionDismissal.delete({
      where: { id: dismissalId },
    });
  }

  /**
   * Try to auto-flag a transaction to an existing active subscription.
   * Returns the subscription ID if matched, null otherwise.
   */
  static async tryAutoFlag(
    userId: string,
    transactionName: string,
    transactionType: string,
    transactionCurrency: string,
    transactionAmount: string,
  ): Promise<string | null> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        active: true,
        type: transactionType as "EXPENSE" | "INCOME",
        currency: transactionCurrency,
      },
    });

    if (subscriptions.length === 0) return null;

    const normalizedInput = transactionName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/g, "")
      .replace(/\b\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}\b/g, "")
      .replace(/\s*#\s*\d+/g, "")
      .replace(/\s*ref\s*:?\s*\d+/gi, "")
      .trim();

    const txAmount = parseFloat(transactionAmount);

    for (const sub of subscriptions) {
      const subNormalized = sub.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

      const subAmount = sub.amount.toNumber();

      if (
        normalizedInput.includes(subNormalized) ||
        subNormalized.includes(normalizedInput)
      ) {
        const tolerance = subAmount * 0.05;
        if (Math.abs(txAmount - subAmount) <= tolerance) {
          return sub.id;
        }
      }
    }

    return null;
  }

  private static parseSubscription(
    subscription: {
      id: string;
      name: string;
      type: string;
      amount: { toString: () => string };
      currency: string;
      frequency: string;
      active: boolean;
      transactions?: Array<{
        id: string;
        name: string;
        amount: { toString: () => string };
        currency: string;
        transactionDate: Date;
        type: string;
      }>;
      createdAt: Date;
      updatedAt: Date;
    },
  ): ISubscription {
    return SubscriptionSchema.parse({
      id: subscription.id,
      name: subscription.name,
      type: subscription.type,
      amount: subscription.amount.toString(),
      currency: subscription.currency,
      frequency: subscription.frequency,
      active: subscription.active,
      transactions: subscription.transactions?.map((t) => ({
        id: t.id,
        name: t.name,
        amount: t.amount.toString(),
        currency: t.currency,
        transactionDate: t.transactionDate.toISOString(),
        type: t.type,
      })),
      createdAt: subscription.createdAt.toISOString(),
      updatedAt: subscription.updatedAt.toISOString(),
    });
  }
}
