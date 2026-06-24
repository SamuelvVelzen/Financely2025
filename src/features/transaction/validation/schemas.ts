import { z } from "zod";
import {
  CurrencySchema,
  PaymentMethodSchema,
  TimePrecisionSchema,
  TransactionTypeSchema,
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

export const TransactionSchema = z.object({
  id: z.string(),
  type: TransactionTypeSchema,
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
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const CreateTransactionInputSchema = z.object({
  type: TransactionTypeSchema,
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
