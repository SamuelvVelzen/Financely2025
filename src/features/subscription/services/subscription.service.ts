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
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export class SubscriptionService {
  static async confirmSubscription(
    userId: string,
    workspaceId: IWorkspaceId,
    input: IConfirmSubscriptionInput,
  ): Promise<ISubscription> {
    const validated = ConfirmSubscriptionInputSchema.parse(input);

    const txCount = await prisma.transaction.count({
      where: {
        id: { in: validated.transactionIds },
        userId,
        workspaceId,
      },
    });

    if (txCount !== validated.transactionIds.length) {
      throw new Error("One or more transactions not found");
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        workspaceId,
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
        workspaceId,
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

  static async listSubscriptions(
    userId: string,
    workspaceId: IWorkspaceId,
    query?: ISubscriptionsQuery,
  ): Promise<ISubscriptionsResponse> {
    const validated = query ? SubscriptionsQuerySchema.parse(query) : {};

    const where: Record<string, unknown> = { userId, workspaceId };
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

  static async getSubscriptionById(
    userId: string,
    workspaceId: IWorkspaceId,
    subscriptionId: string,
  ): Promise<ISubscription | null> {
    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId, workspaceId },
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

  static async updateSubscription(
    userId: string,
    workspaceId: IWorkspaceId,
    subscriptionId: string,
    input: IUpdateSubscriptionInput,
  ): Promise<ISubscription> {
    const validated = UpdateSubscriptionInputSchema.parse(input);

    const existing = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId, workspaceId },
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

  static async deleteSubscription(
    userId: string,
    workspaceId: IWorkspaceId,
    subscriptionId: string,
  ): Promise<void> {
    const existing = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId, workspaceId },
    });

    if (!existing) {
      throw new Error("Subscription not found");
    }

    await prisma.transaction.updateMany({
      where: { subscriptionId, userId, workspaceId },
      data: { subscriptionId: null },
    });

    await prisma.subscription.delete({
      where: { id: subscriptionId },
    });
  }

  static async dismissCandidate(
    userId: string,
    workspaceId: IWorkspaceId,
    input: IDismissSubscriptionCandidateInput,
  ): Promise<void> {
    const validated = DismissSubscriptionCandidateInputSchema.parse(input);

    await prisma.subscriptionDismissal.upsert({
      where: {
        workspaceId_normalizedName_type: {
          workspaceId,
          normalizedName: validated.normalizedName,
          type: validated.type,
        },
      },
      update: {},
      create: {
        userId,
        workspaceId,
        normalizedName: validated.normalizedName,
        type: validated.type,
      },
    });
  }

  static async listDismissals(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<ISubscriptionDismissalsResponse> {
    const dismissals = await prisma.subscriptionDismissal.findMany({
      where: { userId, workspaceId },
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

  static async undismissCandidate(
    userId: string,
    workspaceId: IWorkspaceId,
    dismissalId: string,
  ): Promise<void> {
    const existing = await prisma.subscriptionDismissal.findFirst({
      where: { id: dismissalId, userId, workspaceId },
    });

    if (!existing) {
      throw new Error("Dismissal not found");
    }

    await prisma.subscriptionDismissal.delete({
      where: { id: dismissalId },
    });
  }

  static async tryAutoFlag(
    userId: string,
    workspaceId: IWorkspaceId,
    transactionName: string,
    transactionType: string,
    transactionCurrency: string,
    transactionAmount: string,
  ): Promise<string | null> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        workspaceId,
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

  private static parseSubscription(subscription: {
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
  }): ISubscription {
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
