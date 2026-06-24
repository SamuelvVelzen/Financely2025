import { z } from "zod";
import {
  SUBSCRIPTION_FREQUENCIES,
  type ISubscriptionFrequency,
} from "@/features/subscription/config/frequencies";
import {
  CurrencySchema,
  TransactionTypeSchema,
} from "@/features/shared/validation/enums";
import {
  DecimalStringSchema,
  ISODateStringSchema,
} from "@/features/shared/validation/primitives";

export const SubscriptionFrequencySchema = z.enum([
  ...SUBSCRIPTION_FREQUENCIES,
]);

export { type ISubscriptionFrequency };

export const SubscriptionTransactionSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: DecimalStringSchema,
  currency: z.string(),
  transactionDate: ISODateStringSchema,
  type: TransactionTypeSchema,
});

export const SubscriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: TransactionTypeSchema,
  amount: DecimalStringSchema,
  currency: z.string(),
  frequency: SubscriptionFrequencySchema,
  active: z.boolean(),
  transactions: z.array(SubscriptionTransactionSchema).optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const SubscriptionCandidateSchema = z.object({
  normalizedName: z.string(),
  displayName: z.string(),
  type: TransactionTypeSchema,
  averageAmount: DecimalStringSchema,
  currency: z.string(),
  frequency: SubscriptionFrequencySchema,
  occurrences: z.number().int().min(2),
  transactionIds: z.array(z.string()),
  firstDate: ISODateStringSchema,
  lastDate: ISODateStringSchema,
});

export const DetectSubscriptionsResponseSchema = z.object({
  candidates: z.array(SubscriptionCandidateSchema),
});

export const ConfirmSubscriptionInputSchema = z.object({
  name: z.string().min(1).max(200),
  type: TransactionTypeSchema,
  amount: DecimalStringSchema,
  currency: CurrencySchema,
  frequency: SubscriptionFrequencySchema,
  transactionIds: z.array(z.string()).min(1),
});

export const DismissSubscriptionCandidateInputSchema = z.object({
  normalizedName: z.string().min(1),
  type: TransactionTypeSchema,
});

export const UpdateSubscriptionInputSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  active: z.boolean().optional(),
  frequency: SubscriptionFrequencySchema.optional(),
  amount: DecimalStringSchema.optional(),
});

export const SubscriptionsQuerySchema = z.object({
  active: z.coerce.boolean().optional(),
});

export const SubscriptionsResponseSchema = z.object({
  data: z.array(SubscriptionSchema),
});

export const SubscriptionDismissalSchema = z.object({
  id: z.string(),
  normalizedName: z.string(),
  type: TransactionTypeSchema,
  createdAt: z.string(),
});

export const SubscriptionDismissalsResponseSchema = z.object({
  data: z.array(SubscriptionDismissalSchema),
});

export type ISubscription = z.infer<typeof SubscriptionSchema>;
export type ISubscriptionTransaction = z.infer<
  typeof SubscriptionTransactionSchema
>;
export type ISubscriptionCandidate = z.infer<
  typeof SubscriptionCandidateSchema
>;
export type IDetectSubscriptionsResponse = z.infer<
  typeof DetectSubscriptionsResponseSchema
>;
export type IConfirmSubscriptionInput = z.infer<
  typeof ConfirmSubscriptionInputSchema
>;
export type IDismissSubscriptionCandidateInput = z.infer<
  typeof DismissSubscriptionCandidateInputSchema
>;
export type IUpdateSubscriptionInput = z.infer<
  typeof UpdateSubscriptionInputSchema
>;
export type ISubscriptionsQuery = z.infer<typeof SubscriptionsQuerySchema>;
export type ISubscriptionsResponse = z.infer<
  typeof SubscriptionsResponseSchema
>;
export type ISubscriptionDismissal = z.infer<
  typeof SubscriptionDismissalSchema
>;
export type ISubscriptionDismissalsResponse = z.infer<
  typeof SubscriptionDismissalsResponseSchema
>;
