import { z } from "zod";
// Import currency config (single source of truth)
import {
  getCurrencyOptions as getCurrencyOptionsFromConfig,
  SUPPORTED_CURRENCIES,
  type ICurrency,
} from "@/features/currency/config/currencies";
// Import payment method config (single source of truth)
import {
  PAYMENT_METHOD_VALUES,
  type IPaymentMethod,
} from "@/features/transaction/config/payment-methods";
// Import enums from generated schemas (auto-generated from Prisma schema)
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
// Enums
// ============================================================================

/**
 * Currency schema - created from currency config (single source of truth)
 * No longer generated from Prisma enum, so we can add currencies without migrations
 */
export const CurrencySchema = z.enum([...SUPPORTED_CURRENCIES] as [
  string,
  ...string[],
]);
/**
 * Payment method schema - created from payment method config (single source of truth)
 * No longer generated from Prisma enum, so we can add payment methods without migrations
 */
export const PaymentMethodSchema = z.enum([...PAYMENT_METHOD_VALUES] as [
  string,
  ...string[],
]);
export const TransactionTypeSchema = GeneratedTransactionTypeSchema;

// Re-export enum types for convenience
export type { ICurrency, IPaymentMethod };
export type ITransactionType = z.infer<typeof TransactionTypeSchema>;

/**
 * Get currency options for select inputs
 * Re-exported from currency config for convenience
 */
export { getCurrencyOptionsFromConfig as getCurrencyOptions };

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
  order: z.number().int(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

/**
 * Colors reserved by the app's theme (from globals.css).
 * Users cannot use these for tags to avoid confusion with UI elements.
 */
export const FORBIDDEN_COLORS = [
  // Light mode
  "#f5f5f5", // background
  "#171717", // foreground/text/surface (dark)
  "#737373", // text-muted
  "#e5e5e5", // border/surface-hover
  "#ffffff", // surface/white
  "#2563eb", // primary/info
  "#1d4ed8", // primary-hover/info-hover
  "#dc2626", // danger
  "#b91c1c", // danger-hover
  "#fee2e2", // danger-bg
  "#dbeafe", // info-bg
  "#d97706", // warning
  "#b45309", // warning-hover
  "#fef3c7", // warning-bg
  "#16a34a", // success
  "#15803d", // success-hover
  "#dcfce7", // success-bg
  // Dark mode
  "#0a0a0a", // background
  "#ededed", // foreground/text
  "#a3a3a3", // text-muted
  "#262626", // border/surface-hover
  "#3b82f6", // primary/info
  "#60a5fa", // primary-hover/info-hover
  "#ef4444", // danger
  "#f87171", // danger-hover
  "#7f1d1d", // danger-bg
  "#1e3a8a", // info-bg
  "#f59e0b", // warning
  "#fbbf24", // warning-hover
  "#78350f", // warning-bg
  "#22c55e", // success
  "#4ade80", // success-hover
  "#14532d", // success-bg
];

export const CreateTagInputSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Color must be a valid hex code (e.g., #FF5500)"
    )
    .superRefine((val, ctx) => {
      if (FORBIDDEN_COLORS.some((c) => c.toLowerCase() === val.toLowerCase())) {
        ctx.addIssue({
          code: "custom",
          message: `${val} is a reserved color and cannot be used`,
        });
      }
    })
    .nullable()
    .optional(),
  description: z.string().max(500).nullable().optional(),
  order: z.number().int().optional(),
});

export const UpdateTagInputSchema = CreateTagInputSchema.partial();

export const ReorderTagsInputSchema = z.object({
  tagIds: z.array(z.string()),
});

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
// Tag CSV Import schemas
// ============================================================================

export const TagCsvUploadResponseSchema = z.object({
  columns: z.array(z.string()),
  sampleRows: z.array(z.record(z.string(), z.string())).optional(),
  fileInfo: z.object({
    fileName: z.string(),
    fileSize: z.number(),
    estimatedRowCount: z.number().optional(),
  }),
});

export const TagCsvFieldMappingSchema = z.record(
  z.string(),
  z.string().nullable()
);

export const TagCsvMappingValidationSchema = z.object({
  valid: z.boolean(),
  missingFields: z.array(z.string()),
});

export const TagCsvParseRequestSchema = z.object({
  mapping: TagCsvFieldMappingSchema,
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export const TagCsvCandidateErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const TagCsvCandidateSchema = z.object({
  rowIndex: z.number().int().min(0),
  status: z.enum(["valid", "invalid", "warning"]),
  data: CreateTagInputSchema,
  rawValues: z.record(z.string(), z.string()),
  errors: z.array(TagCsvCandidateErrorSchema),
});

export const TagCsvParseResponseSchema = z.object({
  candidates: z.array(TagCsvCandidateSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalValid: z.number().int().min(0),
  totalInvalid: z.number().int().min(0),
  hasNext: z.boolean(),
});

export const TagCsvImportRequestSchema = z.object({
  tags: z.array(CreateTagInputSchema).min(1),
});

export const TagCsvImportResponseSchema = z.object({
  successCount: z.number().int().min(0),
  failureCount: z.number().int().min(0),
  errors: z.array(BulkCreateTagErrorSchema),
});

// ============================================================================
// Transaction schemas
// ============================================================================

/**
 * Tag data embedded in transaction responses
 * Only includes fields needed for transaction display
 */
export const TransactionTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
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
  paymentMethod: PaymentMethodSchema,
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
  notes: z.string().max(2000).nullable().optional(),
  externalId: z.string().max(200).nullable().optional(),
  paymentMethod: PaymentMethodSchema,
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
  minAmount: DecimalStringSchema.optional(),
  maxAmount: DecimalStringSchema.optional(),
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

// ============================================================================
// CSV Import schemas
// ============================================================================

export const CsvUploadResponseSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.string())),
});

export const CsvFieldMappingSchema = z.record(
  z.string(),
  z.string().nullable()
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
  rawValues: z.record(z.string(), z.string()),
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

// ============================================================================
// User schemas
// ============================================================================

/**
 * Format full name from firstName, lastName, and suffix
 * @param firstName - First name
 * @param lastName - Last name
 * @param suffix - Suffix (e.g., "Jr.", "Sr.", "III")
 * @returns Formatted full name or null if all fields are empty
 */
export function formatFullName(
  firstName?: string | null,
  lastName?: string | null,
  suffix?: string | null
): string | null {
  const parts: string[] = [];

  if (firstName) {
    parts.push(firstName);
  }

  if (lastName) {
    parts.push(lastName);
  }

  if (suffix) {
    parts.push(suffix);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

/**
 * App User schema (User table - app data)
 */
export const UserSchema = z.object({
  id: z.string(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

/**
 * User Response schema (includes email and name from UserInfo)
 */
export const UserResponseSchema = UserSchema.extend({
  email: z.string().email(),
  name: z.string(),
});

/**
 * User Profile schema (UserInfo table - auth/profile data)
 */
export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
  suffix: z.string().nullable(),
  name: z.string(),
  image: z.string().nullable(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const UserProfileResponseSchema = UserProfileSchema;

/**
 * Update User Profile Input schema (for profile editing)
 */
export const UpdateUserProfileInputSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  suffix: z.string().max(20).nullable().optional(),
});

/**
 * Connected Account schema (for account management)
 */
export const ConnectedAccountSchema = z.object({
  id: z.string(),
  providerId: z.string(), // "credential", "google", "microsoft", "apple"
  createdAt: z.string().datetime(),
});

export const ConnectedAccountsResponseSchema = z.object({
  accounts: z.array(ConnectedAccountSchema),
  hasPassword: z.boolean(),
});

/**
 * Change Password Input schema
 */
export const ChangePasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

/**
 * Change Email Input schema
 */
export const ChangeEmailInputSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
});

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

export type ITag = z.infer<typeof TagSchema>;
export type ITransaction = z.infer<typeof TransactionSchema>;
export type IUser = z.infer<typeof UserSchema>;
export type ICreateTagInput = z.infer<typeof CreateTagInputSchema>;
export type IUpdateTagInput = z.infer<typeof UpdateTagInputSchema>;
export type IReorderTagsInput = z.infer<typeof ReorderTagsInputSchema>;
export type ITagsQuery = z.infer<typeof TagsQuerySchema>;
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
export type ITagsResponse = z.infer<typeof TagsResponseSchema>;
export type IBulkCreateTagInput = z.infer<typeof BulkCreateTagInputSchema>;
export type IBulkCreateTagResponse = z.infer<
  typeof BulkCreateTagResponseSchema
>;
export type IBulkCreateTransactionInput = z.infer<
  typeof BulkCreateTransactionInputSchema
>;
export type IBulkCreateTransactionResponse = z.infer<
  typeof BulkCreateTransactionResponseSchema
>;
export type IUserResponse = z.infer<typeof UserResponseSchema>;
export type IUserProfile = z.infer<typeof UserProfileSchema>;
export type IUpdateUserProfileInput = z.infer<
  typeof UpdateUserProfileInputSchema
>;
export type IConnectedAccount = z.infer<typeof ConnectedAccountSchema>;
export type IConnectedAccountsResponse = z.infer<
  typeof ConnectedAccountsResponseSchema
>;
export type IChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;
export type IChangeEmailInput = z.infer<typeof ChangeEmailInputSchema>;
export type IErrorResponse = z.infer<typeof ErrorResponseSchema>;
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
export type ITagCsvUploadResponse = z.infer<typeof TagCsvUploadResponseSchema>;
export type ITagCsvFieldMapping = z.infer<typeof TagCsvFieldMappingSchema>;
export type ITagCsvMappingValidation = z.infer<
  typeof TagCsvMappingValidationSchema
>;
export type ITagCsvParseRequest = z.infer<typeof TagCsvParseRequestSchema>;
export type ITagCsvCandidate = z.infer<typeof TagCsvCandidateSchema>;
export type ITagCsvParseResponse = z.infer<typeof TagCsvParseResponseSchema>;
export type ITagCsvImportRequest = z.infer<typeof TagCsvImportRequestSchema>;
export type ITagCsvImportResponse = z.infer<typeof TagCsvImportResponseSchema>;
