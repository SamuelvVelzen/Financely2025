import {
  calculateDaysRemaining,
  calculateSpendingPace,
} from "@/features/budget/utils/budget-overview-helpers";
import {
  BudgetAlertSchema,
  BudgetComparisonSchema,
  BudgetItemComparisonSchema,
  BudgetItemMonthlyAmountSchema,
  BudgetItemSchema,
  BudgetMonthlyBreakdownSchema,
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
  type IBudgetMonthlyBreakdown,
  type IBudgetsOverviewResponse,
  type IBudgetsQuery,
  type ICreateBudgetInput,
  type ITransaction,
  type IUpdateBudgetInput,
} from "@/features/shared/validation/schemas";
import {
  buildRatesByDateMap,
  convertAmount,
} from "@/features/currency/services/conversion.service";
import { ExchangeRateService } from "@/features/currency/services/exchange-rate.service";
import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { Prisma } from "@prisma/client";

const BUDGET_ITEMS_INCLUDE = {
  items: {
    include: {
      tag: {
        select: {
          id: true,
          name: true,
          color: true,
          emoticon: true,
          transactionType: true,
        },
      },
      monthlyAmounts: true,
    },
  },
} as const;

type IPrismaBudgetItem = {
  id: string;
  budgetId: string;
  tagId: string | null;
  categoryType: string | null;
  createdAt: Date;
  updatedAt: Date;
  monthlyAmounts: Array<{
    id: string;
    budgetItemId: string;
    year: number;
    month: number;
    expectedAmount: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

function getItemMapKey(tagId: string | null, categoryType: string | null): string {
  if (tagId !== null) return tagId;
  return `misc:${categoryType ?? "EXPENSE"}`;
}

function resolveRatesForDateKey(
  ratesByDate: ReturnType<typeof buildRatesByDateMap>,
  dateKey: string,
): Record<string, number> | null {
  if (ratesByDate[dateKey]) {
    return ratesByDate[dateKey].rates;
  }
  const sortedKeys = Object.keys(ratesByDate).sort();
  for (let i = sortedKeys.length - 1; i >= 0; i--) {
    if (sortedKeys[i] <= dateKey) {
      return ratesByDate[sortedKeys[i]].rates;
    }
  }
  return sortedKeys.length > 0 ? ratesByDate[sortedKeys[0]].rates : null;
}

function getTransactionAmountInCurrency(
  amount: string,
  fromCurrency: string,
  toCurrency: string,
  transactionDate: string,
  ratesByDate: ReturnType<typeof buildRatesByDateMap>,
): number {
  const numericAmount = parseFloat(amount);
  if (fromCurrency === toCurrency) {
    return numericAmount;
  }
  const rates = resolveRatesForDateKey(
    ratesByDate,
    transactionDate.slice(0, 10),
  );
  if (!rates) {
    return numericAmount;
  }
  return convertAmount(numericAmount, fromCurrency, toCurrency, rates) ?? numericAmount;
}

function parseBudgetItem(item: IPrismaBudgetItem) {
  return BudgetItemSchema.parse({
    id: item.id,
    budgetId: item.budgetId,
    tagId: item.tagId,
    categoryType: item.categoryType,
    monthlyAmounts: item.monthlyAmounts.map((ma) =>
      BudgetItemMonthlyAmountSchema.parse({
        id: ma.id,
        budgetItemId: ma.budgetItemId,
        year: ma.year,
        month: ma.month,
        expectedAmount: ma.expectedAmount.toString(),
        createdAt: ma.createdAt.toISOString(),
        updatedAt: ma.updatedAt.toISOString(),
      }),
    ),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  });
}

function parseBudget(budget: {
  id: string;
  userId: string;
  name: string;
  periodType: string;
  startDate: Date;
  endDate: Date;
  currency: string;
  items: IPrismaBudgetItem[];
  createdAt: Date;
  updatedAt: Date;
}): IBudget {
  return BudgetSchema.parse({
    id: budget.id,
    userId: budget.userId,
    name: budget.name,
    periodType: budget.periodType,
    startDate: budget.startDate.toISOString(),
    endDate: budget.endDate.toISOString(),
    currency: budget.currency,
    items: budget.items.map(parseBudgetItem),
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  });
}

function getTotalExpectedFromItems(items: IBudget["items"]): number {
  return items.reduce(
    (sum, item) =>
      sum +
      item.monthlyAmounts.reduce(
        (mSum, ma) => mSum + parseFloat(ma.expectedAmount),
        0,
      ),
    0,
  );
}

type ITransactionCategory = "EXPENSE" | "INCOME";

type IPrismaBudgetItemWithTag = IPrismaBudgetItem & {
  tag: { transactionType: string } | null;
};

function buildItemCategoryMap(
  items: IPrismaBudgetItemWithTag[],
): Map<string, ITransactionCategory> {
  const map = new Map<string, ITransactionCategory>();
  for (const item of items) {
    const key = getItemMapKey(item.tagId, item.categoryType);
    const category: ITransactionCategory =
      item.tagId === null
        ? ((item.categoryType as ITransactionCategory) ?? "EXPENSE")
        : ((item.tag?.transactionType as ITransactionCategory) ?? "EXPENSE");
    map.set(key, category);
  }
  return map;
}

function buildBudgetTotals(
  entries: Array<{
    expected: number;
    actual: number;
    category: ITransactionCategory;
  }>,
) {
  const expenses = { expected: 0, actual: 0 };
  const income = { expected: 0, actual: 0 };

  for (const entry of entries) {
    const bucket = entry.category === "INCOME" ? income : expenses;
    bucket.expected += entry.expected;
    bucket.actual += entry.actual;
  }

  const toCategoryTotals = (amounts: { expected: number; actual: number }) => ({
    expected: amounts.expected.toString(),
    actual: amounts.actual.toString(),
    difference: (amounts.actual - amounts.expected).toString(),
  });

  return {
    expenses: toCategoryTotals(expenses),
    income: toCategoryTotals(income),
  };
}

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
    workspaceId: IWorkspaceId,
    query: IBudgetsQuery,
  ): Promise<{ data: IBudget[] }> {
    const validated = BudgetsQuerySchema.parse(query);

    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        workspaceId,
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
        ...(validated.q
          ? {
              name: {
                contains: validated.q,
              },
            }
          : {}),
      },
      include: BUDGET_ITEMS_INCLUDE,
      orderBy: {
        startDate: "desc",
      },
    });

    return {
      data: budgets.map(parseBudget),
    };
  }

  /**
   * Get budget by ID (user-scoped)
   */
  static async getBudgetById(
    userId: string,
    workspaceId: IWorkspaceId,
    budgetId: string,
  ): Promise<IBudget | null> {
    const budget = await prisma.budget.findFirst({
      where: { id: budgetId, userId, workspaceId },
      include: BUDGET_ITEMS_INCLUDE,
    });

    if (!budget) {
      return null;
    }

    return parseBudget(budget);
  }

  /**
   * Create a new budget with items and monthly amounts
   */
  static async createBudget(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ICreateBudgetInput,
  ): Promise<IBudget> {
    const validated = CreateBudgetInputSchema.parse(input);

    // Validate all tagIds belong to user (if not null)
    const tagIds = validated.items
      .map((item) => item.tagId)
      .filter((id): id is string => id !== null);

    if (tagIds.length > 0) {
      const userTags = await prisma.tag.findMany({
        where: { id: { in: tagIds }, userId, workspaceId },
        select: { id: true },
      });

      if (userTags.length !== tagIds.length) {
        throw new Error("One or more tags do not belong to user");
      }
    }

    // Duplicate check is done in CreateBudgetInputSchema superRefine (tagId + categoryType)
    // Use transaction + unchecked BudgetItem creates so tagId and categoryType are accepted
    const budget = await prisma.$transaction(async (tx) => {
      const created = await tx.budget.create({
        data: {
          userId,
          workspaceId,
          name: validated.name,
          periodType: validated.periodType,
          startDate: new Date(validated.startDate),
          endDate: new Date(validated.endDate),
          currency: validated.currency,
        },
      });

      for (const item of validated.items) {
        await tx.budgetItem.create({
          data: {
            budgetId: created.id,
            tagId: item.tagId,
            categoryType:
              item.tagId === null ? item.categoryType ?? null : null,
            monthlyAmounts: {
              create: item.monthlyAmounts.map((ma) => ({
                year: ma.year,
                month: ma.month,
                expectedAmount: new Prisma.Decimal(ma.expectedAmount),
              })),
            },
          },
        });
      }

      return tx.budget.findUniqueOrThrow({
        where: { id: created.id },
        include: BUDGET_ITEMS_INCLUDE,
      });
    });

    return parseBudget(budget);
  }

  /**
   * Update budget
   */
  static async updateBudget(
    userId: string,
    workspaceId: IWorkspaceId,
    budgetId: string,
    input: IUpdateBudgetInput,
  ): Promise<IBudget> {
    const existing = await this.getBudgetById(userId, workspaceId, budgetId);
    if (!existing) {
      throw new Error("Budget not found");
    }

    const validated = UpdateBudgetInputSchema.parse(input);

    if (validated.items) {
      const tagIds = validated.items
        .map((item) => item.tagId)
        .filter((id): id is string => id !== null);

      if (tagIds.length > 0) {
        const userTags = await prisma.tag.findMany({
          where: { id: { in: tagIds }, userId, workspaceId },
          select: { id: true },
        });

        if (userTags.length !== tagIds.length) {
          throw new Error("One or more tags do not belong to user");
        }
      }

      // Duplicate check is done in UpdateBudgetInputSchema superRefine (tagId + categoryType)
    }

    const updateData: Prisma.BudgetUpdateInput = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.periodType) updateData.periodType = validated.periodType;
    if (validated.startDate)
      updateData.startDate = new Date(validated.startDate);
    if (validated.endDate) updateData.endDate = new Date(validated.endDate);
    if (validated.currency) updateData.currency = validated.currency;

    if (validated.items) {
      // Delete existing items (cascades to monthly amounts)
      await prisma.budgetItem.deleteMany({
        where: { budgetId },
      });

      // Create items with unchecked API so tagId and categoryType are accepted
      for (const item of validated.items) {
        await prisma.budgetItem.create({
          data: {
            budgetId,
            tagId: item.tagId,
            categoryType:
              item.tagId === null ? item.categoryType ?? null : null,
            monthlyAmounts: {
              create: item.monthlyAmounts.map((ma) => ({
                year: ma.year,
                month: ma.month,
                expectedAmount: new Prisma.Decimal(ma.expectedAmount),
              })),
            },
          },
        });
      }
    }

    const budget =
      Object.keys(updateData).length > 0
        ? await prisma.budget.update({
            where: { id: budgetId },
            data: updateData,
            include: BUDGET_ITEMS_INCLUDE,
          })
        : await prisma.budget.findUniqueOrThrow({
            where: { id: budgetId },
            include: BUDGET_ITEMS_INCLUDE,
          });

    return parseBudget(budget);
  }

  /**
   * Delete budget
   */
  static async deleteBudget(
    userId: string,
    workspaceId: IWorkspaceId,
    budgetId: string,
  ): Promise<void> {
    const existing = await this.getBudgetById(userId, workspaceId, budgetId);
    if (!existing) {
      throw new Error("Budget not found");
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    });
  }

  /**
   * Get budget comparison (actual vs expected) with monthly breakdown
   */
  static async getBudgetComparison(
    userId: string,
    workspaceId: IWorkspaceId,
    budgetId: string,
  ): Promise<IBudgetComparison> {
    const budgetData = await prisma.budget.findFirst({
      where: { id: budgetId, userId, workspaceId },
      include: BUDGET_ITEMS_INCLUDE,
    });

    if (!budgetData) {
      throw new Error("Budget not found");
    }

    const budget = parseBudget(budgetData);
    const itemCategoryMap = buildItemCategoryMap(budgetData.items);

    // Query ALL transactions in the budget date range (any currency)
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        workspaceId,
        transactionDate: {
          gte: new Date(budget.startDate),
          lte: new Date(budget.endDate),
        },
      },
      include: {
        tags: {
          select: { id: true, name: true, color: true, emoticon: true },
        },
        primaryTag: {
          select: { id: true, name: true, color: true, emoticon: true },
        },
        subscription: {
          select: { id: true, name: true, frequency: true, active: true },
        },
      },
    });

    const parsedTransactions: ITransaction[] = transactions.map((tx) =>
      TransactionSchema.parse({
        id: tx.id,
        type: tx.type,
        amount: tx.amount.toString(),
        currency: tx.currency,
        transactionDate: tx.transactionDate.toISOString(),
        timePrecision: tx.timePrecision,
        name: tx.name,
        description: tx.description,
        externalId: tx.externalId,
        paymentMethod: tx.paymentMethod,
        tags: tx.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: tag.color,
          emoticon: tag.emoticon,
        })),
        primaryTag: tx.primaryTag
          ? {
              id: tx.primaryTag.id,
              name: tx.primaryTag.name,
              color: tx.primaryTag.color,
              emoticon: tx.primaryTag.emoticon,
            }
          : null,
        subscription: tx.subscription
          ? {
              id: tx.subscription.id,
              name: tx.subscription.name,
              frequency: tx.subscription.frequency,
              active: tx.subscription.active,
            }
          : null,
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString(),
      }),
    );

    const transactionDateKeys = [
      ...new Set(
        parsedTransactions.map((tx) => tx.transactionDate.slice(0, 10)),
      ),
    ];
    const ratesForDates =
      await ExchangeRateService.getRatesForDates(transactionDateKeys);
    const ratesByDate = buildRatesByDateMap(ratesForDates);

    const getBudgetAmount = (tx: ITransaction): number =>
      getTransactionAmountInCurrency(
        tx.amount,
        tx.currency,
        budget.currency,
        tx.transactionDate,
        ratesByDate,
      );

    // Build key -> transactions map (key = tagId for tagged, or misc:EXPENSE/misc:INCOME for misc) and alert map
    const tagTransactionMap = new Map<string, ITransaction[]>();
    const alertMap = new Map<string, ITransaction[]>();

    for (const transaction of parsedTransactions) {
      const primaryTagId = transaction.primaryTag?.id ?? null;

      if (primaryTagId === null) {
        const miscKey = `misc:${transaction.type}`;
        const miscTransactions = tagTransactionMap.get(miscKey) ?? [];
        miscTransactions.push(transaction);
        tagTransactionMap.set(miscKey, miscTransactions);
      } else {
        const hasBudgetItem = budget.items.some(
          (item) => item.tagId === primaryTagId,
        );

        if (hasBudgetItem) {
          const existing = tagTransactionMap.get(primaryTagId) ?? [];
          existing.push(transaction);
          tagTransactionMap.set(primaryTagId, existing);
        } else {
          const existing = alertMap.get(primaryTagId) ?? [];
          existing.push(transaction);
          alertMap.set(primaryTagId, existing);
        }
      }
    }

    // Aggregated item comparisons (sum of all monthly amounts as expected)
    const itemComparisons: IBudgetItemComparison[] = budget.items.map(
      (item) => {
        const mapKey = getItemMapKey(item.tagId, item.categoryType ?? null);
        const itemTransactions = tagTransactionMap.get(mapKey) ?? [];
        const actualAmount = itemTransactions.reduce(
          (sum, tx) => sum + getBudgetAmount(tx),
          0,
        );
        const expectedAmount = item.monthlyAmounts.reduce(
          (sum, ma) => sum + parseFloat(ma.expectedAmount),
          0,
        );
        const difference = actualAmount - expectedAmount;
        const percentage =
          expectedAmount > 0 ? (actualAmount / expectedAmount) * 100 : 0;

        return BudgetItemComparisonSchema.parse({
          item,
          expected: expectedAmount.toString(),
          actual: actualAmount.toString(),
          difference: difference.toString(),
          percentage: Math.round(percentage * 100) / 100,
          transactions: itemTransactions,
        });
      },
    );

    // Build monthly breakdown
    // Group transactions by year-month
    const txByMonth = new Map<string, ITransaction[]>();
    for (const tx of parsedTransactions) {
      const d = new Date(tx.transactionDate);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const arr = txByMonth.get(key) ?? [];
      arr.push(tx);
      txByMonth.set(key, arr);
    }

    // Collect all unique months from monthly amounts
    const monthSet = new Set<string>();
    for (const item of budget.items) {
      for (const ma of item.monthlyAmounts) {
        monthSet.add(`${ma.year}-${ma.month}`);
      }
    }

    const monthlyBreakdown: IBudgetMonthlyBreakdown[] = Array.from(monthSet)
      .sort()
      .map((key) => {
        const [yearStr, monthStr] = key.split("-");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const monthTxs = txByMonth.get(key) ?? [];

        // Build key -> transactions for this month (key = tagId or misc:EXPENSE/misc:INCOME)
        const monthTagTxMap = new Map<string, ITransaction[]>();
        for (const tx of monthTxs) {
          const tagId = tx.primaryTag?.id ?? null;
          const hasBudgetItem = budget.items.some((i) => i.tagId === tagId);
          if (tagId === null) {
            const key = `misc:${tx.type}`;
            const arr = monthTagTxMap.get(key) ?? [];
            arr.push(tx);
            monthTagTxMap.set(key, arr);
          } else if (hasBudgetItem) {
            const arr = monthTagTxMap.get(tagId) ?? [];
            arr.push(tx);
            monthTagTxMap.set(tagId, arr);
          }
        }

        const items = budget.items.map((item) => {
          const ma = item.monthlyAmounts.find(
            (m) => m.year === year && m.month === month,
          );
          const expected = ma ? parseFloat(ma.expectedAmount) : 0;
          const mapKey = getItemMapKey(item.tagId, item.categoryType ?? null);
          const txsForTag = monthTagTxMap.get(mapKey) ?? [];
          const actual = txsForTag.reduce(
            (s, tx) => s + getBudgetAmount(tx),
            0,
          );
          const difference = actual - expected;
          const percentage = expected > 0 ? (actual / expected) * 100 : 0;

          return {
            tagId: item.tagId,
            categoryType: item.categoryType ?? undefined,
            expected: expected.toString(),
            actual: actual.toString(),
            difference: difference.toString(),
            percentage: Math.round(percentage * 100) / 100,
            transactions: txsForTag,
          };
        });

        const monthTotals = buildBudgetTotals(
          items.map((item) => ({
            expected: parseFloat(item.expected),
            actual: parseFloat(item.actual),
            category:
              itemCategoryMap.get(
                getItemMapKey(item.tagId, item.categoryType ?? null),
              ) ?? "EXPENSE",
          })),
        );

        return BudgetMonthlyBreakdownSchema.parse({
          year,
          month,
          items,
          totals: monthTotals,
        });
      });

    // Build alerts
    const alerts: IBudgetAlert[] = [];
    for (const [_tagId, txs] of alertMap) {
      const totalAmount = txs.reduce(
        (sum, tx) => sum + getBudgetAmount(tx),
        0,
      );
      const firstTx = txs[0];
      const tag = firstTx.primaryTag;
      if (tag) {
        alerts.push(
          BudgetAlertSchema.parse({
            tagId: tag.id,
            tagName: tag.name,
            tagColor: tag.color,
            tagEmoticon: tag.emoticon,
            transactionCount: txs.length,
            totalAmount: totalAmount.toString(),
            transactions: txs,
          }),
        );
      }
    }

    const totals = buildBudgetTotals(
      itemComparisons.map((comparison) => ({
        expected: parseFloat(comparison.expected),
        actual: parseFloat(comparison.actual),
        category:
          itemCategoryMap.get(
            getItemMapKey(
              comparison.item.tagId,
              comparison.item.categoryType ?? null,
            ),
          ) ?? "EXPENSE",
      })),
    );

    return BudgetComparisonSchema.parse({
      budget,
      items: itemComparisons,
      alerts,
      totals,
      monthlyBreakdown,
    });
  }

  /**
   * Get aggregated overview data for all active budgets
   */
  static async getBudgetsOverview(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<IBudgetsOverviewResponse> {
    const now = new Date();

    const allBudgets = await prisma.budget.findMany({
      where: { userId, workspaceId },
      include: BUDGET_ITEMS_INCLUDE,
      orderBy: { startDate: "desc" },
    });

    const activeBudgets = allBudgets.filter((budget) => {
      const start = new Date(budget.startDate);
      const end = new Date(budget.endDate);
      return now >= start && now <= end;
    });

    const allBudgetsParsed = allBudgets.map(parseBudget);

    if (activeBudgets.length === 0) {
      const totalExpectedAll = allBudgetsParsed.reduce(
        (sum, b) => sum + getTotalExpectedFromItems(b.items),
        0,
      );

      return BudgetsOverviewResponseSchema.parse({
        overallHealth: {
          totalExpected: "0",
          totalActual: "0",
          remaining: "0",
          percentage: 0,
          activeCount: 0,
          currency: "USD",
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
          totalExpectedAll: totalExpectedAll.toString(),
        },
      });
    }

    // Determine primary currency
    const currencyCounts = new Map<string, number>();
    activeBudgets.forEach((budget) => {
      currencyCounts.set(
        budget.currency,
        (currencyCounts.get(budget.currency) || 0) + 1,
      );
    });
    const primaryCurrency = Array.from(currencyCounts.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    const activeBudgetsPrimaryCurrency = activeBudgets.filter(
      (budget) => budget.currency === primaryCurrency,
    );

    let totalExpected = 0;
    let totalActual = 0;
    const budgetPercentages: number[] = [];
    const tagSpendingMap = new Map<
      string,
      { name: string; color: string | null; emoticon: string | null; amount: number }
    >();

    for (const budgetData of activeBudgetsPrimaryCurrency) {
      const budget = parseBudget(budgetData);

      const budgetExpected = getTotalExpectedFromItems(budget.items);
      totalExpected += budgetExpected;

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          workspaceId,
          transactionDate: {
            gte: new Date(budget.startDate),
            lte: new Date(budget.endDate),
          },
        },
        include: {
          primaryTag: {
            select: { id: true, name: true, color: true, emoticon: true },
          },
        },
      });

      const overviewDateKeys = [
        ...new Set(
          transactions.map((tx) =>
            tx.transactionDate.toISOString().slice(0, 10),
          ),
        ),
      ];
      const overviewRatesForDates =
        await ExchangeRateService.getRatesForDates(overviewDateKeys);
      const overviewRatesByDate = buildRatesByDateMap(overviewRatesForDates);

      transactions.forEach((tx) => {
        const amount = getTransactionAmountInCurrency(
          tx.amount.toString(),
          tx.currency,
          budget.currency,
          tx.transactionDate.toISOString(),
          overviewRatesByDate,
        );
        if (tx.primaryTag) {
          const existing = tagSpendingMap.get(tx.primaryTag.id);
          if (existing) {
            existing.amount += amount;
          } else {
            tagSpendingMap.set(tx.primaryTag.id, {
              name: tx.primaryTag.name,
              color: tx.primaryTag.color,
              emoticon: tx.primaryTag.emoticon,
              amount,
            });
          }
        }
      });

      const budgetActual = transactions.reduce(
        (sum, tx) =>
          sum +
          getTransactionAmountInCurrency(
            tx.amount.toString(),
            tx.currency,
            budget.currency,
            tx.transactionDate.toISOString(),
            overviewRatesByDate,
          ),
        0,
      );
      totalActual += budgetActual;

      const budgetPercentage =
        budgetExpected > 0 ? (budgetActual / budgetExpected) * 100 : 0;
      budgetPercentages.push(budgetPercentage);
    }

    const remaining = totalExpected - totalActual;
    const overallPercentage =
      totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;

    const nearingLimit = budgetPercentages.filter(
      (pct) => pct >= 80 && pct <= 100,
    ).length;
    const overBudget = budgetPercentages.filter((pct) => pct > 100).length;

    const endDates = activeBudgetsPrimaryCurrency.map(
      (b) => new Date(b.endDate),
    );
    const earliestEndDate = new Date(
      Math.min(...endDates.map((d) => d.getTime())),
    );
    const daysRemaining = calculateDaysRemaining(earliestEndDate);

    const startDates = activeBudgetsPrimaryCurrency.map(
      (b) => new Date(b.startDate),
    );
    const earliestStartDate = new Date(
      Math.min(...startDates.map((d) => d.getTime())),
    );
    const daysElapsed = Math.max(
      1,
      Math.ceil(
        (now.getTime() - earliestStartDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const totalDays = Math.ceil(
      (earliestEndDate.getTime() - earliestStartDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const spendingPace = calculateSpendingPace(
      totalActual,
      totalExpected,
      daysElapsed,
      totalDays,
    );

    const topSpenders: {
      tagId: string;
      tagName: string;
      tagColor: string | null;
      tagEmoticon: string | null;
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
          tagEmoticon: tagData.emoticon,
          amount: tagData.amount.toString(),
          percentage: Math.round(percentage * 100) / 100,
        });
      });
    }

    const totalExpectedAll = allBudgetsParsed.reduce(
      (sum, b) => sum + getTotalExpectedFromItems(b.items),
      0,
    );

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
