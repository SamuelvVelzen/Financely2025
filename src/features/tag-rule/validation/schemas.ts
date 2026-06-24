import { z } from "zod";
import { TransactionTypeSchema } from "@/features/shared/validation/enums";
import { ISODateStringSchema } from "@/features/shared/validation/primitives";
import { TransactionTagSchema } from "@/features/tag/validation/schemas";

export const TagRulePatternTypeSchema = z.enum(["KEYWORD", "REGEX"]);
export const TagRuleMatchFieldSchema = z.enum(["NAME", "DESCRIPTION", "BOTH"]);
export const TagRuleApplyAsSchema = z.enum(["PRIMARY", "TAG", "BOTH"]);
export const TagRuleSourceSchema = z.enum(["USER", "SYSTEM", "LEARNED"]);

export const TagRuleSchema = z.object({
  id: z.string(),
  tagId: z.string(),
  tag: TransactionTagSchema.optional(),
  label: z.string().nullable(),
  keywords: z.array(z.string()),
  pattern: z.string().nullable(),
  patternType: TagRulePatternTypeSchema,
  matchField: TagRuleMatchFieldSchema,
  applyAs: TagRuleApplyAsSchema,
  priority: z.number().int(),
  source: TagRuleSourceSchema,
  enabled: z.boolean(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const CreateTagRuleInputSchema = z.object({
  tagId: z.string().min(1),
  label: z.string().max(100).nullable().optional(),
  keywords: z.array(z.string().min(1).max(100)).min(1).max(50),
  pattern: z.string().max(500).nullable().optional(),
  patternType: TagRulePatternTypeSchema.default("KEYWORD"),
  matchField: TagRuleMatchFieldSchema.default("NAME"),
  applyAs: TagRuleApplyAsSchema.default("PRIMARY"),
  priority: z.number().int().min(0).max(1000).default(0),
  enabled: z.boolean().default(true),
  source: TagRuleSourceSchema.optional(),
});

export const UpdateTagRuleInputSchema = CreateTagRuleInputSchema.partial();

export const TagRulesResponseSchema = z.object({
  data: z.array(TagRuleSchema),
});

export const TagMatchRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  type: TransactionTypeSchema,
});

export const TagMatchResultSchema = z.object({
  ruleId: z.string(),
  ruleLabel: z.string().nullable(),
  tagId: z.string(),
  tagName: z.string(),
  tagColor: z.string().nullable(),
  applyAs: TagRuleApplyAsSchema,
  source: TagRuleSourceSchema,
});

export const TagMatchResponseSchema = z.object({
  matches: z.array(TagMatchResultSchema),
  suggestions: z.object({
    primaryTagId: z.string().nullable(),
    tagIds: z.array(z.string()),
  }),
});

export const TagHistoryDiscoverySchema = z.object({
  keyword: z.string(),
  tagId: z.string(),
  tagName: z.string(),
  count: z.number().int(),
  confidence: z.number(),
});

export const TagHistoryDiscoveryResponseSchema = z.object({
  data: z.array(TagHistoryDiscoverySchema),
});

export const EnableTagRulePresetsInputSchema = z.object({
  presetIds: z.array(z.string()).min(1),
  tagNameMap: z.record(z.string(), z.string()).optional(),
});

export const TagSuggestionRuleSchema = z.object({
  ruleId: z.string(),
  ruleLabel: z.string().nullable(),
  source: TagRuleSourceSchema,
});

export const TagSuggestionsSchema = z.object({
  primaryTagId: z.string().nullable(),
  tagIds: z.array(z.string()),
  suggested: z.boolean(),
  primaryRule: TagSuggestionRuleSchema.nullable().optional(),
});

export type ITagRule = z.infer<typeof TagRuleSchema>;
export type ICreateTagRuleInput = z.infer<typeof CreateTagRuleInputSchema>;
export type IUpdateTagRuleInput = z.infer<typeof UpdateTagRuleInputSchema>;
export type ITagRulesResponse = z.infer<typeof TagRulesResponseSchema>;
export type ITagMatchRequest = z.infer<typeof TagMatchRequestSchema>;
export type ITagMatchResult = z.infer<typeof TagMatchResultSchema>;
export type ITagMatchResponse = z.infer<typeof TagMatchResponseSchema>;
export type ITagHistoryDiscovery = z.infer<typeof TagHistoryDiscoverySchema>;
export type ITagHistoryDiscoveryResponse = z.infer<
  typeof TagHistoryDiscoveryResponseSchema
>;
export type IEnableTagRulePresetsInput = z.infer<
  typeof EnableTagRulePresetsInputSchema
>;
export type ITagSuggestions = z.infer<typeof TagSuggestionsSchema>;
export type ITagSuggestionRule = z.infer<typeof TagSuggestionRuleSchema>;
export type ITagRulePatternType = z.infer<typeof TagRulePatternTypeSchema>;
export type ITagRuleMatchField = z.infer<typeof TagRuleMatchFieldSchema>;
export type ITagRuleApplyAs = z.infer<typeof TagRuleApplyAsSchema>;
export type ITagRuleSource = z.infer<typeof TagRuleSourceSchema>;
