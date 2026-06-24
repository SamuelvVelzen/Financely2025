import { z } from "zod";
import { TransactionTypeSchema } from "@/features/shared/validation/enums";
import { ISODateStringSchema } from "@/features/shared/validation/primitives";
import { CreateTagRuleWithTagInputSchema } from "@/features/tag-rule/validation/rule-input-schemas";

export const TransactionTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  emoticon: z.string().nullable().optional(),
});

export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  emoticon: z
    .string()
    .nullable()
    .or(z.undefined())
    .transform((val) => val ?? null),
  order: z.number().int(),
  transactionType: TransactionTypeSchema,
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const FORBIDDEN_COLORS = [
  "#f5f5f5",
  "#171717",
  "#737373",
  "#e5e5e5",
  "#ffffff",
  "#2563eb",
  "#1d4ed8",
  "#dc2626",
  "#b91c1c",
  "#fee2e2",
  "#dbeafe",
  "#d97706",
  "#b45309",
  "#fef3c7",
  "#16a34a",
  "#15803d",
  "#dcfce7",
  "#0a0a0a",
  "#ededed",
  "#a3a3a3",
  "#262626",
  "#3b82f6",
  "#60a5fa",
  "#ef4444",
  "#f87171",
  "#7f1d1d",
  "#1e3a8a",
  "#f59e0b",
  "#fbbf24",
  "#78350f",
  "#22c55e",
  "#4ade80",
  "#14532d",
];

const EMOJI_REGEX =
  /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base})/u;

export const CreateTagFieldsSchema = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "Color must be a valid hex code (e.g., #FF5500)",
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
  emoticon: z
    .string()
    .max(20, "Emoticon must be 20 characters or less")
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        EMOJI_REGEX.lastIndex = 0;
        return EMOJI_REGEX.test(val);
      },
      {
        message: "Emoticon must contain at least one emoji character",
      },
    )
    .nullable()
    .optional(),
  order: z.number().int().optional(),
  transactionType: TransactionTypeSchema,
});

export const CreateTagInputSchema = CreateTagFieldsSchema.extend({
  rules: z.array(CreateTagRuleWithTagInputSchema).max(20).optional(),
});

export const UpdateTagInputSchema = CreateTagFieldsSchema.partial();

export const TagMetadataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  color: z.string().nullable(),
  emoticon: z.string().nullable(),
});

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
  z.string().nullable(),
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

export type ITag = z.infer<typeof TagSchema>;
export type ITagMetadata = z.infer<typeof TagMetadataSchema>;
export type ICreateTagInput = z.infer<typeof CreateTagInputSchema>;
export type IUpdateTagInput = z.infer<typeof UpdateTagInputSchema>;
export type IReorderTagsInput = z.infer<typeof ReorderTagsInputSchema>;
export type ITagsQuery = z.infer<typeof TagsQuerySchema>;
export type ITagsResponse = z.infer<typeof TagsResponseSchema>;
export type IBulkCreateTagInput = z.infer<typeof BulkCreateTagInputSchema>;
export type IBulkCreateTagResponse = z.infer<typeof BulkCreateTagResponseSchema>;
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
