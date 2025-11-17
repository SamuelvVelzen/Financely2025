import { z } from "zod";
// Import enums from generated schemas (auto-generated from Prisma schema)
import { CurrencySchema as GeneratedCurrencySchema } from "./generated.ts/schemas/enums/Currency.schema";
import { TransactionTypeSchema as GeneratedTransactionTypeSchema } from "./generated.ts/schemas/enums/TransactionType.schema";

/**
 * This file contains API-specific validation schemas.
 *
 * Base Prisma schemas are auto-generated from schema.prisma via prisma-zod-generator.
 * When the Prisma schema changes, run `prisma generate` to update generated schemas.
 *
 * These schemas apply custom transformations for API serialization:
 * - Dates → ISO strings
 * - Decimal → string (for precision)
 * - Removes relation fields (only keeps IDs/references)
 * - Adds custom validation rules
 */

// ============================================================================
// Enums (re-export from generated, auto-updates with Prisma schema)
// ============================================================================

export const CurrencySchema = GeneratedCurrencySchema;
export const TransactionTypeSchema = GeneratedTransactionTypeSchema;

// Re-export enum types for convenience
export type Currency = z.infer<typeof CurrencySchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

/**
 * Currency options for select inputs
 * Type-safe array that matches CurrencySchema enum values
 */
const CURRENCY_VALUES: readonly Currency[] = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
] as const;

/**
 * Get currency options for select inputs
 * Returns formatted options array for UI components
 */
export function getCurrencyOptions(): Array<{
  value: Currency;
  label: string;
}> {
  return CURRENCY_VALUES.map((value) => ({
    value,
    label: value,
  }));
}

// ============================================================================
// Date handling (ISO strings)
// ============================================================================

const ISODateStringSchema = z.string().datetime();

// ============================================================================
// Decimal as string (for API serialization)
// ============================================================================

const DecimalStringSchema = z
  .string()
  .regex(/^-?\d+\.?\d*$/, "Must be a valid decimal number");

// ============================================================================
// Common patterns
// ============================================================================

const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const SortQuerySchema = z.object({
  sort: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const [field, direction] = val.split(":");
        return (
          ["occurredAt", "amount", "name"].includes(field) &&
          ["asc", "desc"].includes(direction)
        );
      },
      { message: "Sort format: field:asc|desc (e.g., occurredAt:desc)" }
    )
    .optional(),
});

// ============================================================================
// Tag schemas
// ============================================================================

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const CreateTagInputSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .nullable()
    .optional(),
  description: z.string().max(500).nullable().optional(),
});

export const UpdateTagInputSchema = CreateTagInputSchema.partial();

export const TagsQuerySchema = z.object({
  q: z.string().optional(),
  sort: z.enum(["name:asc", "name:desc"]).optional().default("name:asc"),
});

export const TagsResponseSchema = z.object({
  data: z.array(TagSchema),
});

export const BulkCreateTagInputSchema = z
  .array(CreateTagInputSchema)
  .min(1)
  .max(100);

export const BulkCreateTagErrorSchema = z.object({
  index: z.number().int().min(0),
  message: z.string(),
});

export const BulkCreateTagResponseSchema = z.object({
  created: z.array(TagSchema),
  errors: z.array(BulkCreateTagErrorSchema),
});

// ============================================================================
// Transaction schemas
// ============================================================================

export const TransactionTagSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const TransactionSchema = z.object({
  id: z.string(),
  type: TransactionTypeSchema,
  amount: DecimalStringSchema,
  currency: CurrencySchema,
  occurredAt: ISODateStringSchema,
  name: z.string(),
  description: z.string().nullable(),
  externalId: z.string().nullable(),
  tags: z.array(TransactionTagSchema),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const CreateTransactionInputSchema = z.object({
  type: TransactionTypeSchema,
  amount: DecimalStringSchema,
  currency: CurrencySchema,
  occurredAt: ISODateStringSchema,
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  externalId: z.string().max(200).nullable().optional(),
  tagIds: z.array(z.string()).optional().default([]),
});

export const UpdateTransactionInputSchema =
  CreateTransactionInputSchema.partial();

export const TransactionsQuerySchema = PaginationQuerySchema.merge(
  SortQuerySchema
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
  .min(1)
  .max(100);

export const BulkCreateTransactionErrorSchema = z.object({
  index: z.number().int().min(0),
  message: z.string(),
});

export const BulkCreateTransactionResponseSchema = z.object({
  created: z.array(TransactionSchema),
  errors: z.array(BulkCreateTransactionErrorSchema),
});

// ============================================================================
// User schemas
// ============================================================================

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
  // preferences.defaultCurrency will be added later if needed
});

export const UserResponseSchema = UserSchema;

// ============================================================================
// Error response schema
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

// ============================================================================
// Type exports
// ============================================================================

export type Tag = z.infer<typeof TagSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type User = z.infer<typeof UserSchema>;
export type CreateTagInput = z.infer<typeof CreateTagInputSchema>;
export type UpdateTagInput = z.infer<typeof UpdateTagInputSchema>;
export type TagsQuery = z.infer<typeof TagsQuerySchema>;
export type CreateTransactionInput = z.infer<
  typeof CreateTransactionInputSchema
>;
export type UpdateTransactionInput = z.infer<
  typeof UpdateTransactionInputSchema
>;
export type TransactionsQuery = z.infer<typeof TransactionsQuerySchema>;
export type PaginatedTransactionsResponse = z.infer<
  typeof PaginatedTransactionsResponseSchema
>;
export type TagsResponse = z.infer<typeof TagsResponseSchema>;
export type BulkCreateTagInput = z.infer<typeof BulkCreateTagInputSchema>;
export type BulkCreateTagResponse = z.infer<typeof BulkCreateTagResponseSchema>;
export type BulkCreateTransactionInput = z.infer<
  typeof BulkCreateTransactionInputSchema
>;
export type BulkCreateTransactionResponse = z.infer<
  typeof BulkCreateTransactionResponseSchema
>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
