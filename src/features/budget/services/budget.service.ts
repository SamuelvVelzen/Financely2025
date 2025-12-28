import {
  calculateDaysRemaining,
  calculateSpendingPace,
} from "@/features/budget/utils/budget-overview-helpers";
import {
  BudgetAlertSchema,
  BudgetComparisonSchema,
  BudgetItemComparisonSchema,
  BudgetItemSchema,
  BudgetSchema,
  BudgetsOverviewResponseSchema,
  BudgetsQuerySchema,
  CreateBudgetInputSchema,
  TransactionSchema,
  UpdateBudgetInputSchema,
  type IBudget,
  type IBudgetAlert,
  type IBudgetComparison,
  type IBudgetItemComparison,
  type IBudgetsOverviewResponse,
  type IBudgetsQuery,
  type ICreateBudgetInput,
  type ITransaction,
  type IUpdateBudgetInput,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import { Prisma } from "@prisma/client";

/**
 * Budget Service
 * Handles budget-related business logic and data access
 */
export class BudgetService {
  /**
   * List budgets for a user with optional filtering
   */
  static async listBudgets(
    userId: string,
    query: IBudgetsQuery
  ): Promise<{ data: IBudget[] }> {
    const validated = BudgetsQuerySchema.parse(query);

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        ...(validated.from || validated.to
          ? {
              OR: [
                {
                  startDate: {
                    ...(validated.to ? { lte: new Date(validated.to) } : {}),
                  },
                  endDate: {
                    ...(validated.from
                      ? { gte: new Date(validated.from) }
                      : {}),
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        items: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    return {
      data: budgets.map((budget) =>
        BudgetSchema.parse({
          id: budget.id,
          userId: budget.userId,
          name: budget.name,
          startDate: budget.startDate.toISOString(),
          endDate: budget.endDate.toISOString(),
          currency: budget.currency,
          items: budget.items.map((item) =>
            BudgetItemSchema.parse({
              id: item.id,
              budgetId: item.budgetId,
              tagId: item.tagId,
              expectedAmount: item.expectedAmount.toString(),
              createdAt: item.createdAt.toISOString(),
              updatedAt: item.updatedAt.toISOString(),
            })
          ),
          createdAt: budget.createdAt.toISOString(),
          updatedAt: budget.updatedAt.toISOString(),
        })
      ),
    };
  }

  /**
   * Get budget by ID (user-scoped)
   */
  static async getBudgetById(
    userId: string,
    budgetId: string
  ): Promise<IBudget | null> {
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId,
      },
      include: {
        items: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!budget) {
      return null;
    }

    return BudgetSchema.parse({
      id: budget.id,
      userId: budget.userId,
      name: budget.name,
      startDate: budget.startDate.toISOString(),
      endDate: budget.endDate.toISOString(),
      currency: budget.currency,
      items: budget.items.map((item) =>
        BudgetItemSchema.parse({
          id: item.id,
          budgetId: item.budgetId,
          tagId: item.tagId,
          expectedAmount: item.expectedAmount.toString(),
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })
      ),
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    });
  }

  /**
   * Create a new budget with items
   */
  static async createBudget(
    userId: string,
    input: ICreateBudgetInput
  ): Promise<IBudget> {
    const validated = CreateBudgetInputSchema.parse(input);

    // Validate all tagIds belong to user (if not null)
    const tagIds = validated.items
      .map((item) => item.tagId)
      .filter((id): id is string => id !== null);

    if (tagIds.length > 0) {
      const userTags = await prisma.tag.findMany({
        where: {
          id: { in: tagIds },
          userId,
        },
        select: { id: true },
      });

      if (userTags.length !== tagIds.length) {
        throw new Error("One or more tags do not belong to user");
      }
    }

    // Check for duplicate tagIds (including null for Misc)
    const tagIdSet = new Set<string | null>();
    for (const item of validated.items) {
      if (tagIdSet.has(item.tagId)) {
        throw new Error(
          `Duplicate tag entry: ${item.tagId === null ? "Misc" : item.tagId}`
        );
      }
      tagIdSet.add(item.tagId);
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        name: validated.name,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        currency: validated.currency,
        items: {
          create: validated.items.map((item) => ({
            tagId: item.tagId,
            expectedAmount: new Prisma.Decimal(item.expectedAmount),
          })),
        },
      },
      include: {
        items: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return BudgetSchema.parse({
      id: budget.id,
      userId: budget.userId,
      name: budget.name,
      startDate: budget.startDate.toISOString(),
      endDate: budget.endDate.toISOString(),
      currency: budget.currency,
      items: budget.items.map((item) =>
        BudgetItemSchema.parse({
          id: item.id,
          budgetId: item.budgetId,
          tagId: item.tagId,
          expectedAmount: item.expectedAmount.toString(),
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })
      ),
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    });
  }

  /**
   * Update budget
   */
  static async updateBudget(
    userId: string,
    budgetId: string,
    input: IUpdateBudgetInput
  ): Promise<IBudget> {
    // Verify budget belongs to user
    const existing = await this.getBudgetById(userId, budgetId);
    if (!existing) {
      throw new Error("Budget not found");
    }

    const validated = UpdateBudgetInputSchema.parse(input);

    // If updating items, validate tags
    if (validated.items) {
      const tagIds = validated.items
        .map((item) => item.tagId)
        .filter((id): id is string => id !== null);

      if (tagIds.length > 0) {
        const userTags = await prisma.tag.findMany({
          where: {
            id: { in: tagIds },
            userId,
          },
          select: { id: true },
        });

        if (userTags.length !== tagIds.length) {
          throw new Error("One or more tags do not belong to user");
        }
      }

      // Check for duplicate tagIds
      const tagIdSet = new Set<string | null>();
      for (const item of validated.items) {
        if (tagIdSet.has(item.tagId)) {
          throw new Error(
            `Duplicate tag entry: ${item.tagId === null ? "Misc" : item.tagId}`
          );
        }
        tagIdSet.add(item.tagId);
      }
    }

    // Update budget
    const updateData: Prisma.BudgetUpdateInput = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.startDate)
      updateData.startDate = new Date(validated.startDate);
    if (validated.endDate) updateData.endDate = new Date(validated.endDate);
    if (validated.currency) updateData.currency = validated.currency;

    // If items are provided, replace all items
    if (validated.items) {
      // Delete existing items
      await prisma.budgetItem.deleteMany({
        where: { budgetId },
      });

      // Create new items
      updateData.items = {
        create: validated.items.map((item) => ({
          tagId: item.tagId,
          expectedAmount: new Prisma.Decimal(item.expectedAmount),
        })),
      };
    }

    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
      include: {
        items: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return BudgetSchema.parse({
      id: budget.id,
      userId: budget.userId,
      name: budget.name,
      startDate: budget.startDate.toISOString(),
      endDate: budget.endDate.toISOString(),
      currency: budget.currency,
      items: budget.items.map((item) =>
        BudgetItemSchema.parse({
          id: item.id,
          budgetId: item.budgetId,
          tagId: item.tagId,
          expectedAmount: item.expectedAmount.toString(),
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })
      ),
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    });
  }

  /**
   * Delete budget
   */
  static async deleteBudget(userId: string, budgetId: string): Promise<void> {
    // Verify budget belongs to user
    const existing = await this.getBudgetById(userId, budgetId);
    if (!existing) {
      throw new Error("Budget not found");
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    });
  }

  /**
   * Get budget comparison (actual vs expected)
   */
  static async getBudgetComparison(
    userId: string,
    budgetId: string
  ): Promise<IBudgetComparison> {
    // Fetch budget with items and tag relations
    const budgetData = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId,
      },
      include: {
        items: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!budgetData) {
      throw new Error("Budget not found");
    }

    const budget = BudgetSchema.parse({
      id: budgetData.id,
      userId: budgetData.userId,
      name: budgetData.name,
      startDate: budgetData.startDate.toISOString(),
      endDate: budgetData.endDate.toISOString(),
      currency: budgetData.currency,
      items: budgetData.items.map((item) =>
        BudgetItemSchema.parse({
          id: item.id,
          budgetId: item.budgetId,
          tagId: item.tagId,
          expectedAmount: item.expectedAmount.toString(),
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        })
      ),
      createdAt: budgetData.createdAt.toISOString(),
      updatedAt: budgetData.updatedAt.toISOString(),
    });

    // Query ALL transactions in the budget date range with matching currency
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        currency: budget.currency,
        occurredAt: {
          gte: new Date(budget.startDate),
          lte: new Date(budget.endDate),
        },
      },
      include: {
        tags: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        primaryTag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Parse transactions
    const parsedTransactions: ITransaction[] = transactions.map((tx) =>
      TransactionSchema.parse({
        id: tx.id,
        type: tx.type,
        amount: tx.amount.toString(),
        currency: tx.currency,
        occurredAt: tx.occurredAt.toISOString(),
        name: tx.name,
        description: tx.description,
        externalId: tx.externalId,
        paymentMethod: tx.paymentMethod,
        tags: tx.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
        })),
        primaryTag: tx.primaryTag
          ? {
              id: tx.primaryTag.id,
              name: tx.primaryTag.name,
              color: tx.primaryTag.color,
            }
          : null,
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString(),
      })
    );

    // Build map of tagId -> transactions
    const tagTransactionMap = new Map<string | null, ITransaction[]>();
    const alertMap = new Map<string, ITransaction[]>();

    for (const transaction of parsedTransactions) {
      const primaryTagId = transaction.primaryTag?.id ?? null;

      if (primaryTagId === null) {
        // Untagged transaction - goes to Misc if exists
        const miscTransactions = tagTransactionMap.get(null) ?? [];
        miscTransactions.push(transaction);
        tagTransactionMap.set(null, miscTransactions);
      } else {
        // Check if this tag has a budget item
        const hasBudgetItem = budget.items.some(
          (item) => item.tagId === primaryTagId
        );

        if (hasBudgetItem) {
          // Count toward budget item
          const existing = tagTransactionMap.get(primaryTagId) ?? [];
          existing.push(transaction);
          tagTransactionMap.set(primaryTagId, existing);
        } else {
          // Add to alerts
          const existing = alertMap.get(primaryTagId) ?? [];
          existing.push(transaction);
          alertMap.set(primaryTagId, existing);
        }
      }
    }

    // Calculate comparisons for each budget item
    const itemComparisons: IBudgetItemComparison[] = budget.items.map(
      (item) => {
        const itemTransactions = tagTransactionMap.get(item.tagId) ?? [];
        const actualAmount = itemTransactions.reduce(
          (sum, tx) => sum + parseFloat(tx.amount),
          0
        );
        const expectedAmount = parseFloat(item.expectedAmount);
        const difference = actualAmount - expectedAmount;
        const percentage =
          expectedAmount > 0 ? (actualAmount / expectedAmount) * 100 : 0;

        return BudgetItemComparisonSchema.parse({
          item,
          expected: item.expectedAmount,
          actual: actualAmount.toString(),
          difference: difference.toString(),
          percentage: Math.round(percentage * 100) / 100,
          transactions: itemTransactions,
        });
      }
    );

    // Build alerts for tags without budget items
    const alerts: IBudgetAlert[] = [];
    const tagIds = Array.from(alertMap.keys());

    for (const tagId of tagIds) {
      const transactions = alertMap.get(tagId) ?? [];
      const totalAmount = transactions.reduce(
        (sum, tx) => sum + parseFloat(tx.amount),
        0
      );

      // Get tag info from first transaction
      const firstTx = transactions[0];
      const tag = firstTx.primaryTag;
      if (tag) {
        alerts.push(
          BudgetAlertSchema.parse({
            tagId: tag.id,
            tagName: tag.name,
            tagColor: tag.color,
            transactionCount: transactions.length,
            totalAmount: totalAmount.toString(),
            transactions,
          })
        );
      }
    }

    // Calculate totals
    const totalExpected = budget.items.reduce(
      (sum, item) => sum + parseFloat(item.expectedAmount),
      0
    );
    const totalActual = parsedTransactions.reduce(
      (sum, tx) => sum + parseFloat(tx.amount),
      0
    );
    const totalDifference = totalActual - totalExpected;

    return BudgetComparisonSchema.parse({
      budget,
      items: itemComparisons,
      alerts,
      totals: {
        totalExpected: totalExpected.toString(),
        totalActual: totalActual.toString(),
        totalDifference: totalDifference.toString(),
      },
    });
  }

  /**
   * Get aggregated overview data for all active budgets
   */
  static async getBudgetsOverview(
    userId: string
  ): Promise<IBudgetsOverviewResponse> {
    const now = new Date();

    // Get all budgets for user
    const allBudgets = await prisma.budget.findMany({
      where: {
        userId,
      },
      include: {
        items: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    // Filter to active budgets
    const activeBudgets = allBudgets.filter((budget) => {
      const start = new Date(budget.startDate);
      const end = new Date(budget.endDate);
      return now >= start && now <= end;
    });

    // If no active budgets, return empty overview
    if (activeBudgets.length === 0) {
      return BudgetsOverviewResponseSchema.parse({
        overallHealth: {
          totalExpected: "0",
          totalActual: "0",
          remaining: "0",
          percentage: 0,
          activeCount: 0,
          currency: "USD", // Default fallback
        },
        riskSummary: {
          totalActive: 0,
          nearingLimit: 0,
          overBudget: 0,
        },
        timeContext: {
          daysRemaining: null,
          spendingPace: null,
          primaryBudgetEndDate: null,
        },
        topSpenders: [],
        context: {
          totalBudgets: allBudgets.length,
          totalExpectedAll: allBudgets
            .reduce((sum, b) => {
              return (
                sum +
                b.items.reduce((itemSum, item) => {
                  return itemSum + parseFloat(item.expectedAmount.toString());
                }, 0)
              );
            }, 0)
            .toString(),
        },
      });
    }

    // Determine primary currency (most common among active budgets)
    const currencyCounts = new Map<string, number>();
    activeBudgets.forEach((budget) => {
      currencyCounts.set(
        budget.currency,
        (currencyCounts.get(budget.currency) || 0) + 1
      );
    });
    const primaryCurrency = Array.from(currencyCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    // Filter to active budgets with primary currency
    const activeBudgetsPrimaryCurrency = activeBudgets.filter(
      (budget) => budget.currency === primaryCurrency
    );

    // Calculate overall health metrics
    let totalExpected = 0;
    let totalActual = 0;
    const budgetPercentages: number[] = [];
    const tagSpendingMap = new Map<
      string,
      { name: string; color: string | null; amount: number }
    >();

    // Process each active budget
    for (const budgetData of activeBudgetsPrimaryCurrency) {
      const budget = BudgetSchema.parse({
        id: budgetData.id,
        userId: budgetData.userId,
        name: budgetData.name,
        startDate: budgetData.startDate.toISOString(),
        endDate: budgetData.endDate.toISOString(),
        currency: budgetData.currency,
        items: budgetData.items.map((item) =>
          BudgetItemSchema.parse({
            id: item.id,
            budgetId: item.budgetId,
            tagId: item.tagId,
            expectedAmount: item.expectedAmount.toString(),
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          })
        ),
        createdAt: budgetData.createdAt.toISOString(),
        updatedAt: budgetData.updatedAt.toISOString(),
      });

      // Calculate expected for this budget
      const budgetExpected = budget.items.reduce(
        (sum, item) => sum + parseFloat(item.expectedAmount),
        0
      );
      totalExpected += budgetExpected;

      // Fetch transactions for this budget
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          currency: budget.currency,
          occurredAt: {
            gte: new Date(budget.startDate),
            lte: new Date(budget.endDate),
          },
        },
        include: {
          primaryTag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      });

      // Calculate actual spending per tag
      const tagAmountMap = new Map<string | null, number>();
      transactions.forEach((tx) => {
        const tagId = tx.primaryTag?.id ?? null;
        const amount = parseFloat(tx.amount.toString());
        tagAmountMap.set(tagId, (tagAmountMap.get(tagId) || 0) + amount);

        // Track spending for biggest driver
        if (tx.primaryTag) {
          const existing = tagSpendingMap.get(tx.primaryTag.id);
          if (existing) {
            existing.amount += amount;
          } else {
            tagSpendingMap.set(tx.primaryTag.id, {
              name: tx.primaryTag.name,
              color: tx.primaryTag.color,
              amount,
            });
          }
        }
      });

      // Calculate actual for this budget (sum of all transactions)
      const budgetActual = transactions.reduce(
        (sum, tx) => sum + parseFloat(tx.amount.toString()),
        0
      );
      totalActual += budgetActual;

      // Calculate percentage for risk assessment
      const budgetPercentage =
        budgetExpected > 0 ? (budgetActual / budgetExpected) * 100 : 0;
      budgetPercentages.push(budgetPercentage);
    }

    // Calculate remaining
    const remaining = totalExpected - totalActual;
    const overallPercentage =
      totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;

    // Calculate risk summary
    const nearingLimit = budgetPercentages.filter(
      (pct) => pct >= 80 && pct <= 100
    ).length;
    const overBudget = budgetPercentages.filter((pct) => pct > 100).length;

    // Calculate time context
    const endDates = activeBudgetsPrimaryCurrency.map(
      (b) => new Date(b.endDate)
    );
    const earliestEndDate = new Date(
      Math.min(...endDates.map((d) => d.getTime()))
    );
    const daysRemaining = calculateDaysRemaining(earliestEndDate);

    // Calculate spending pace (aggregate across all active budgets)
    const startDates = activeBudgetsPrimaryCurrency.map(
      (b) => new Date(b.startDate)
    );
    const earliestStartDate = new Date(
      Math.min(...startDates.map((d) => d.getTime()))
    );
    const daysElapsed = Math.max(
      1,
      Math.ceil(
        (now.getTime() - earliestStartDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );
    const totalDays = Math.ceil(
      (earliestEndDate.getTime() - earliestStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const spendingPace = calculateSpendingPace(
      totalActual,
      totalExpected,
      daysElapsed,
      totalDays
    );

    // Find top 3 spenders
    const topSpenders: {
      tagId: string;
      tagName: string;
      tagColor: string | null;
      amount: string;
      percentage: number;
    }[] = [];

    if (tagSpendingMap.size > 0) {
      const entries = Array.from(tagSpendingMap.entries());
      const sortedTags = entries
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 3);

      sortedTags.forEach(([tagId, tagData]) => {
        const percentage =
          totalActual > 0 ? (tagData.amount / totalActual) * 100 : 0;

        topSpenders.push({
          tagId,
          tagName: tagData.name,
          tagColor: tagData.color,
          amount: tagData.amount.toString(),
          percentage: Math.round(percentage * 100) / 100,
        });
      });
    }

    // Calculate total expected across all budgets (for context)
    const totalExpectedAll = allBudgets.reduce((sum, budget) => {
      return (
        sum +
        budget.items.reduce((itemSum, item) => {
          return itemSum + parseFloat(item.expectedAmount.toString());
        }, 0)
      );
    }, 0);

    return BudgetsOverviewResponseSchema.parse({
      overallHealth: {
        totalExpected: totalExpected.toString(),
        totalActual: totalActual.toString(),
        remaining: remaining.toString(),
        percentage: Math.round(overallPercentage * 100) / 100,
        activeCount: activeBudgetsPrimaryCurrency.length,
        currency: primaryCurrency,
      },
      riskSummary: {
        totalActive: activeBudgetsPrimaryCurrency.length,
        nearingLimit,
        overBudget,
      },
      timeContext: {
        daysRemaining,
        spendingPace,
        primaryBudgetEndDate: earliestEndDate.toISOString(),
      },
      topSpenders,
      context: {
        totalBudgets: allBudgets.length,
        totalExpectedAll: totalExpectedAll.toString(),
      },
    });
  }
}
