import { z } from "zod";
import {
  CurrencySchema,
  PaymentMethodSchema,
  TimePrecisionSchema,
  TransactionTypeSchema,
  TransferDirectionSchema,
} from "@/features/shared/validation/enums";
import {
  DecimalStringSchema,
  ISODateStringSchema,
  PaginationQuerySchema,
  SortQuerySchema,
} from "@/features/shared/validation/primitives";
import { TagSuggestionsSchema } from "@/features/tag-rule/validation/schemas";
import {
  TagMetadataSchema,
  TransactionTagSchema,
} from "@/features/tag/validation/schemas";

export const TransactionSubscriptionInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  frequency: z.string(),
  active: z.boolean(),
});

export const TransactionRefundAllocationSchema = z.object({
  id: z.string(),
  refundTransactionId: z.string(),
  expenseTransactionId: z.string(),
  amount: DecimalStringSchema,
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
  expenseTransaction: z
    .object({
      id: z.string(),
      name: z.string(),
      amount: DecimalStringSchema,
      currency: CurrencySchema,
      transactionDate: ISODateStringSchema,
      type: TransactionTypeSchema,
    })
    .optional(),
  refundTransaction: z
    .object({
      id: z.string(),
      name: z.string(),
      amount: DecimalStringSchema,
      currency: CurrencySchema,
      transactionDate: ISODateStringSchema,
      type: TransactionTypeSchema,
    })
    .optional(),
});

export const TransactionSchema = z.object({
  id: z.string(),
  type: TransactionTypeSchema,
  transferDirection: TransferDirectionSchema.nullable().optional(),
  transferGroupId: z.string().nullable().optional(),
  ledgerAccountId: z.string().nullable().optional(),
  amount: DecimalStringSchema,
  currency: CurrencySchema,
  transactionDate: ISODateStringSchema,
  timePrecision: TimePrecisionSchema,
  name: z.string(),
  description: z.string().nullable(),
  externalId: z.string().nullable(),
  paymentMethod: PaymentMethodSchema,
  tags: z.array(TransactionTagSchema),
  primaryTag: TransactionTagSchema.nullable().optional(),
  subscription: TransactionSubscriptionInfoSchema.nullable().optional(),
  refundAllocations: z.array(TransactionRefundAllocationSchema).optional(),
  expenseRefundAllocations: z
    .array(TransactionRefundAllocationSchema)
    .optional(),
  refundRemaining: DecimalStringSchema.optional(),
  expenseNet: DecimalStringSchema.optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const ReplaceRefundAllocationsInputSchema = z.object({
  allocations: z.array(
    z.object({
      expenseTransactionId: z.string().min(1),
      amount: DecimalStringSchema,
    }),
  ),
});

/** Replace refund links from an expense transaction (counterpart = income). */
export const ReplaceExpenseRefundAllocationsInputSchema = z.object({
  allocations: z.array(
    z.object({
      refundTransactionId: z.string().min(1),
      amount: DecimalStringSchema,
    }),
  ),
});

export const RefundAllocationSuggestionSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: DecimalStringSchema,
  currency: CurrencySchema,
  transactionDate: ISODateStringSchema,
  expenseNet: DecimalStringSchema,
  primaryTag: TransactionTagSchema.nullable().optional(),
});

export const RefundAllocationSuggestionsResponseSchema = z.object({
  suggestions: z.array(RefundAllocationSuggestionSchema),
  refundRemaining: DecimalStringSchema,
});

export const CreateTransactionInputSchema = z
  .object({
    type: TransactionTypeSchema,
    transferDirection: TransferDirectionSchema.nullable().optional(),
    transferGroupId: z.string().nullable().optional(),
    ledgerAccountId: z.string().nullable().optional(),
    amount: DecimalStringSchema,
    currency: CurrencySchema,
    transactionDate: ISODateStringSchema,
    timePrecision: TimePrecisionSchema.optional(),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    externalId: z.string().max(200).nullable().optional(),
    paymentMethod: PaymentMethodSchema,
    tagIds: z.array(z.string()).optional().default([]),
    primaryTagId: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TRANSFER") {
      if (data.transferDirection !== "OUT" && data.transferDirection !== "IN") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "transferDirection is required for transfers",
          path: ["transferDirection"],
        });
      }
    } else if (data.transferDirection != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "transferDirection is only for TRANSFER type",
        path: ["transferDirection"],
      });
    }
  });

export const UpdateTransactionInputSchema =
  CreateTransactionInputSchema.partial();

export const TransactionsQuerySchema = PaginationQuerySchema.merge(
  SortQuerySchema,
).extend({
  from: ISODateStringSchema.optional(),
  to: ISODateStringSchema.optional(),
  type: TransactionTypeSchema.optional(),
  tagIds: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  q: z.string().optional(),
  minAmount: DecimalStringSchema.optional(),
  maxAmount: DecimalStringSchema.optional(),
  paymentMethod: z
    .union([PaymentMethodSchema, z.array(PaymentMethodSchema)])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  currency: z
    .union([CurrencySchema, z.array(CurrencySchema)])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  ledgerAccountId: z.string().optional(),
  transferGroupId: z.string().optional(),
  unassignedLedgerAccount: z.coerce.boolean().optional(),
});

export const BulkUpdateTransactionTypeInputSchema = z.object({
  transactionIds: z.array(z.string().min(1)).min(1),
  type: TransactionTypeSchema,
  transferDirection: TransferDirectionSchema.nullable().optional(),
});

export const BulkDeleteTransactionsInputSchema = z.object({
  transactionIds: z.array(z.string().min(1)).min(1),
});

export const BulkDeleteTransactionsResponseSchema = z.object({
  deleted: z.number().int().min(0),
  errors: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
    }),
  ),
});

export const CreateLinkedTransferInputSchema = z.object({
  fromLedgerAccountId: z.string().min(1),
  toLedgerAccountId: z.string().min(1),
  amount: DecimalStringSchema,
  receivedAmount: DecimalStringSchema.optional(),
  currency: CurrencySchema,
  receivedCurrency: CurrencySchema.optional(),
  transactionDate: ISODateStringSchema,
  name: z.string().min(1).max(200).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const PairTransferInputSchema = z.object({
  otherTransactionId: z.string().min(1),
});

export const TransferSuggestionSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: DecimalStringSchema,
  currency: CurrencySchema,
  transactionDate: ISODateStringSchema,
  transferDirection: TransferDirectionSchema.nullable(),
  ledgerAccountId: z.string().nullable().optional(),
  score: z.number(),
});

export const TransferSuggestionsResponseSchema = z.object({
  suggestions: z.array(TransferSuggestionSchema),
});

export const PaginatedTransactionsResponseSchema = z.object({
  data: z.array(TransactionSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  hasNext: z.boolean(),
});

export const BulkCreateTransactionInputSchema = z
  .array(CreateTransactionInputSchema)
  .min(1);

export const BulkCreateTransactionErrorSchema = z.object({
  index: z.number().int().min(0),
  message: z.string(),
});

export const BulkCreateTransactionResponseSchema = z.object({
  created: z.array(TransactionSchema),
  errors: z.array(BulkCreateTransactionErrorSchema),
});

export const CsvUploadResponseSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.string())),
});

export const CsvFieldMappingSchema = z.record(
  z.string(),
  z.string().nullable(),
);

export const CsvMappingValidationSchema = z.object({
  valid: z.boolean(),
  missingFields: z.array(z.string()),
});

export const CsvCandidateTransactionErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const CsvCandidateTransactionSchema = z.object({
  rowIndex: z.number().int().min(0),
  status: z.enum(["valid", "invalid", "warning"]),
  data: CreateTransactionInputSchema,
  primaryTagMetadata: TagMetadataSchema.nullable(),
  tagsMetadata: z.array(TagMetadataSchema),
  tagSuggestions: TagSuggestionsSchema.nullable().optional(),
  errors: z.array(CsvCandidateTransactionErrorSchema),
});

export const CsvTransformRequestSchema = z.object({
  rows: z.array(z.record(z.string(), z.string())),
  mapping: CsvFieldMappingSchema,
  typeDetectionStrategy: z.string().optional(),
  defaultCurrency: CurrencySchema.optional(),
  bank: z.string().optional(),
});

export const CsvTransformResponseSchema = z.object({
  candidates: z.array(CsvCandidateTransactionSchema),
  total: z.number().int().min(0),
  totalValid: z.number().int().min(0),
  totalInvalid: z.number().int().min(0),
});

export const CsvImportRequestSchema = z.object({
  transactions: z.array(CreateTransactionInputSchema).min(1),
});

export const CsvImportResponseSchema = z.object({
  successCount: z.number().int().min(0),
  failureCount: z.number().int().min(0),
  errors: z.array(BulkCreateTransactionErrorSchema),
});

export type ITransaction = z.infer<typeof TransactionSchema>;
export type ITransactionRefundAllocation = z.infer<
  typeof TransactionRefundAllocationSchema
>;
export type IReplaceRefundAllocationsInput = z.infer<
  typeof ReplaceRefundAllocationsInputSchema
>;
export type IReplaceExpenseRefundAllocationsInput = z.infer<
  typeof ReplaceExpenseRefundAllocationsInputSchema
>;
export type IRefundAllocationSuggestion = z.infer<
  typeof RefundAllocationSuggestionSchema
>;
export type IRefundAllocationSuggestionsResponse = z.infer<
  typeof RefundAllocationSuggestionsResponseSchema
>;
export type ICreateTransactionInput = z.infer<
  typeof CreateTransactionInputSchema
>;
export type IUpdateTransactionInput = z.infer<
  typeof UpdateTransactionInputSchema
>;
export type ITransactionsQuery = z.infer<typeof TransactionsQuerySchema>;
export type IPaginatedTransactionsResponse = z.infer<
  typeof PaginatedTransactionsResponseSchema
>;
export type IBulkCreateTransactionInput = z.infer<
  typeof BulkCreateTransactionInputSchema
>;
export type IBulkCreateTransactionResponse = z.infer<
  typeof BulkCreateTransactionResponseSchema
>;
export type ITransactionSubscriptionInfo = z.infer<
  typeof TransactionSubscriptionInfoSchema
>;
export type ICsvUploadResponse = z.infer<typeof CsvUploadResponseSchema>;
export type ICsvFieldMapping = z.infer<typeof CsvFieldMappingSchema>;
export type ICsvMappingValidation = z.infer<typeof CsvMappingValidationSchema>;
export type ICsvCandidateTransaction = z.infer<
  typeof CsvCandidateTransactionSchema
>;
export type ICsvTransformRequest = z.infer<typeof CsvTransformRequestSchema>;
export type ICsvTransformResponse = z.infer<typeof CsvTransformResponseSchema>;
export type ICsvImportRequest = z.infer<typeof CsvImportRequestSchema>;
export type ICsvImportResponse = z.infer<typeof CsvImportResponseSchema>;
export type IBulkUpdateTransactionTypeInput = z.infer<
  typeof BulkUpdateTransactionTypeInputSchema
>;
export type IBulkDeleteTransactionsInput = z.infer<
  typeof BulkDeleteTransactionsInputSchema
>;
export type IBulkDeleteTransactionsResponse = z.infer<
  typeof BulkDeleteTransactionsResponseSchema
>;
export type ICreateLinkedTransferInput = z.infer<
  typeof CreateLinkedTransferInputSchema
>;
export type IPairTransferInput = z.infer<typeof PairTransferInputSchema>;
export type ITransferSuggestion = z.infer<typeof TransferSuggestionSchema>;
export type ITransferSuggestionsResponse = z.infer<
  typeof TransferSuggestionsResponseSchema
>;
