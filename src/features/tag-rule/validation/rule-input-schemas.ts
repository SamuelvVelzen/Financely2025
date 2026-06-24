import { z } from "zod";

export const TagRulePatternTypeSchema = z.enum(["KEYWORD", "REGEX"]);
export const TagRuleMatchFieldSchema = z.enum([
  "NAME",
  "DESCRIPTION",
  "NOTES",
  "PAYMENT_METHOD",
  "TRANSACTION_TYPE",
]);
export const TagRuleApplyAsSchema = z.enum(["PRIMARY", "TAG", "BOTH"]);
export const TagRuleSourceSchema = z.enum(["USER", "SYSTEM", "LEARNED"]);

export const CreateTagRuleInputSchema = z.object({
  tagId: z.string().min(1),
  label: z.string().max(100).nullable().optional(),
  keywords: z.array(z.string().min(1).max(100)).min(1).max(50),
  pattern: z.string().max(500).nullable().optional(),
  patternType: TagRulePatternTypeSchema.default("KEYWORD"),
  matchFields: z
    .array(TagRuleMatchFieldSchema)
    .min(1)
    .max(5)
    .default(["NAME"]),
  applyAs: TagRuleApplyAsSchema.default("PRIMARY"),
  priority: z.number().int().min(0).max(1000).default(0),
  enabled: z.boolean().default(true),
  source: TagRuleSourceSchema.optional(),
});

export const CreateTagRuleWithTagInputSchema = CreateTagRuleInputSchema.omit({
  tagId: true,
  source: true,
});

export const UpdateTagRuleInputSchema = CreateTagRuleInputSchema.partial();

export type ICreateTagRuleInput = z.infer<typeof CreateTagRuleInputSchema>;
export type ICreateTagRuleWithTagInput = z.infer<
  typeof CreateTagRuleWithTagInputSchema
>;
export type IUpdateTagRuleInput = z.infer<typeof UpdateTagRuleInputSchema>;
export type ITagRulePatternType = z.infer<typeof TagRulePatternTypeSchema>;
export type ITagRuleMatchField = z.infer<typeof TagRuleMatchFieldSchema>;
export type ITagRuleApplyAs = z.infer<typeof TagRuleApplyAsSchema>;
export type ITagRuleSource = z.infer<typeof TagRuleSourceSchema>;
