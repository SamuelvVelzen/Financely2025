import { prisma } from "@/features/util/prisma";
import { uniquePreserveOrder } from "@/features/currency/config/currencies";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export class WorkspaceCurrencyService {
  static async getWorkspaceCurrencies(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<string[]> {
    const [transactions, budgets, subscriptions] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, workspaceId },
        select: { currency: true },
        distinct: ["currency"],
      }),
      prisma.budget.findMany({
        where: { userId, workspaceId },
        select: { currency: true },
        distinct: ["currency"],
      }),
      prisma.subscription.findMany({
        where: { userId, workspaceId },
        select: { currency: true },
        distinct: ["currency"],
      }),
    ]);

    return uniquePreserveOrder([
      ...transactions.map((t) => t.currency),
      ...budgets.map((b) => b.currency),
      ...subscriptions.map((s) => s.currency),
    ]);
  }
}
