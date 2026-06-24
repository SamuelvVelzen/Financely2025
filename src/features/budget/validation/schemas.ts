import { z } from "zod";
import {
  CurrencySchema,
  TransactionTypeSchema,
} from "@/features/shared/validation/enums";
import {
  DateStringSchema,
  DecimalStringSchema,
  ISODateStringSchema,
} from "@/features/shared/validation/primitives";
import { TransactionSchema } from "@/features/transaction/validation/schemas";

export const BudgetPresetSchema = z.enum([
  "monthly",
  "yearly",
  "yearly-per-month",
  "custom",
]);

export const BudgetPeriodTypeSchema = z.enum([
  "monthly",
  "yearly",
  "yearly-per-month",
  "custom",
]);

export const BudgetItemMonthlyAmountSchema = z.object({
  id: z.string(),
  budgetItemId: z.string(),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  expectedAmount: DecimalStringSchema,
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const BudgetItemSchema = z
  .object({
    id: z.string(),
    budgetId: z.string(),
    tagId: z.string().nullable(),
    categoryType: TransactionTypeSchema.nullable(),
    monthlyAmounts: z.array(BudgetItemMonthlyAmountSchema),
    createdAt: ISODateStringSchema,
    updatedAt: ISODateStringSchema,
  })
  .refine(
    (data) => {
      if (data.tagId === null) {
        return data.categoryType !== null && data.categoryType !== undefined;
      }
      return data.categoryType === null || data.categoryType === undefined;
    },
    {
      message:
        "categoryType is required when tagId is null; must be null when tagId is set",
    },
  );

export const BudgetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  periodType: BudgetPeriodTypeSchema,
  startDate: ISODateStringSchema,
  endDate: ISODateStringSchema,
  currency: CurrencySchema,
  items: z.array(BudgetItemSchema),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const CreateBudgetItemMonthlyAmountInputSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  expectedAmount: DecimalStringSchema.refine(
    (val) => parseFloat(val) > 0,
    "Expected amount must be greater than 0",
  ),
});

export const CreateBudgetItemInputSchema = z
  .object({
    tagId: z.string().nullable(),
    categoryType: TransactionTypeSchema.nullable().optional(),
    monthlyAmounts: z.array(CreateBudgetItemMonthlyAmountInputSchema).min(0),
  })
  .refine(
    (data) => {
      if (data.tagId === null) {
        return data.categoryType !== null && data.categoryType !== undefined;
      }
      return data.categoryType === null || data.categoryType === undefined;
    },
    {
      message:
        "categoryType is required when tagId is null; must be null when tagId is set",
    },
  );

export const CreateBudgetInputSchema = z
  .object({
    name: z.string().min(1).max(200),
    periodType: BudgetPeriodTypeSchema,
    startDate: DateStringSchema,
    endDate: DateStringSchema,
    currency: CurrencySchema,
    items: z
      .array(CreateBudgetItemInputSchema)
      .min(1, "At least one budget item is required"),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const key = item.tagId ?? `misc_${item.categoryType ?? ""}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate budget item: ${item.tagId === null ? `Miscellaneous (${item.categoryType})` : item.tagId}`,
          path: ["items", i],
        });
      }
      seen.add(key);
    }
  });

export const UpdateBudgetInputSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    periodType: BudgetPeriodTypeSchema.optional(),
    startDate: DateStringSchema.optional(),
    endDate: DateStringSchema.optional(),
    currency: CurrencySchema.optional(),
    items: z.array(CreateBudgetItemInputSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    },
  )
  .superRefine((data, ctx) => {
    if (!data.items) return;
    const seen = new Set<string>();
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const key = item.tagId ?? `misc_${item.categoryType ?? ""}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate budget item: ${item.tagId === null ? `Miscellaneous (${item.categoryType})` : item.tagId}`,
          path: ["items", i],
        });
      }
      seen.add(key);
    }
  });

export const BudgetsQuerySchema = z.object({
  from: ISODateStringSchema.optional(),
  to: ISODateStringSchema.optional(),
  q: z.string().optional(),
});

export const BudgetsResponseSchema = z.object({
  data: z.array(BudgetSchema),
});

export const BudgetItemComparisonSchema = z.object({
  item: BudgetItemSchema,
  expected: DecimalStringSchema,
  actual: DecimalStringSchema,
  difference: DecimalStringSchema,
  percentage: z.number(),
  transactions: z.array(TransactionSchema),
});

export const BudgetMonthlyItemComparisonSchema = z.object({
  tagId: z.string().nullable(),
  categoryType: TransactionTypeSchema.nullable().optional(),
  expected: DecimalStringSchema,
  actual: DecimalStringSchema,
  difference: DecimalStringSchema,
  percentage: z.number(),
  transactions: z.array(TransactionSchema),
});

export const BudgetCategoryTotalsSchema = z.object({
  expected: DecimalStringSchema,
  actual: DecimalStringSchema,
  difference: DecimalStringSchema,
});

export const BudgetTotalsSchema = z.object({
  expenses: BudgetCategoryTotalsSchema,
  income: BudgetCategoryTotalsSchema,
});

export const BudgetMonthlyBreakdownSchema = z.object({
  year: z.number(),
  month: z.number(),
  items: z.array(BudgetMonthlyItemComparisonSchema),
  totals: BudgetTotalsSchema,
});

export const BudgetAlertSchema = z.object({
  tagId: z.string(),
  tagName: z.string(),
  tagColor: z.string().nullable(),
  tagEmoticon: z.string().nullable(),
  transactionCount: z.number().int().min(0),
  totalAmount: DecimalStringSchema,
  transactions: z.array(TransactionSchema),
});

export const BudgetComparisonSchema = z.object({
  budget: BudgetSchema,
  items: z.array(BudgetItemComparisonSchema),
  alerts: z.array(BudgetAlertSchema),
  totals: BudgetTotalsSchema,
  monthlyBreakdown: z.array(BudgetMonthlyBreakdownSchema),
});

export const BudgetsOverviewResponseSchema = z.object({
  overallHealth: z.object({
    totalExpected: DecimalStringSchema,
    totalActual: DecimalStringSchema,
    remaining: DecimalStringSchema,
    percentage: z.number(),
    activeCount: z.number().int().min(0),
    currency: CurrencySchema,
  }),
  riskSummary: z.object({
    totalActive: z.number().int().min(0),
    nearingLimit: z.number().int().min(0),
    overBudget: z.number().int().min(0),
  }),
  timeContext: z.object({
    daysRemaining: z.number().int().min(0).nullable(),
    spendingPace: z.enum(["faster", "slower", "on-track"]).nullable(),
    primaryBudgetEndDate: ISODateStringSchema.nullable(),
  }),
  topSpenders: z
    .array(
      z.object({
        tagId: z.string(),
        tagName: z.string(),
        tagColor: z.string().nullable(),
        tagEmoticon: z.string().nullable(),
        amount: DecimalStringSchema,
        percentage: z.number(),
      }),
    )
    .max(3),
  context: z.object({
    totalBudgets: z.number().int().min(0),
    totalExpectedAll: DecimalStringSchema,
  }),
});

export type IBudgetPreset = z.infer<typeof BudgetPresetSchema>;
export type IBudgetPeriodType = z.infer<typeof BudgetPeriodTypeSchema>;
export type IBudgetItemMonthlyAmount = z.infer<
  typeof BudgetItemMonthlyAmountSchema
>;
export type IBudget = z.infer<typeof BudgetSchema>;
export type IBudgetItem = z.infer<typeof BudgetItemSchema>;
export type ICreateBudgetInput = z.infer<typeof CreateBudgetInputSchema>;
export type ICreateBudgetItemInput = z.infer<
  typeof CreateBudgetItemInputSchema
>;
export type ICreateBudgetItemMonthlyAmountInput = z.infer<
  typeof CreateBudgetItemMonthlyAmountInputSchema
>;
export type IUpdateBudgetInput = z.infer<typeof UpdateBudgetInputSchema>;
export type IBudgetsQuery = z.infer<typeof BudgetsQuerySchema>;
export type IBudgetsResponse = z.infer<typeof BudgetsResponseSchema>;
export type IBudgetItemComparison = z.infer<typeof BudgetItemComparisonSchema>;
export type IBudgetMonthlyItemComparison = z.infer<
  typeof BudgetMonthlyItemComparisonSchema
>;
export type IBudgetMonthlyBreakdown = z.infer<
  typeof BudgetMonthlyBreakdownSchema
>;
export type IBudgetCategoryTotals = z.infer<typeof BudgetCategoryTotalsSchema>;
export type IBudgetTotals = z.infer<typeof BudgetTotalsSchema>;
export type IBudgetAlert = z.infer<typeof BudgetAlertSchema>;
export type IBudgetComparison = z.infer<typeof BudgetComparisonSchema>;
export type IBudgetsOverviewResponse = z.infer<
  typeof BudgetsOverviewResponseSchema
>;
