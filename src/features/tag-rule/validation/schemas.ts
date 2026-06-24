import { z } from "zod";
import {
  PaymentMethodSchema,
  TransactionTypeSchema,
} from "@/features/shared/validation/enums";
import { ISODateStringSchema } from "@/features/shared/validation/primitives";
import { TransactionTagSchema } from "@/features/tag/validation/schemas";
import {
  CreateTagRuleInputSchema,
  CreateTagRuleWithTagInputSchema,
  TagRuleApplyAsSchema,
  TagRuleMatchFieldSchema,
  TagRulePatternTypeSchema,
  TagRuleSourceSchema,
  UpdateTagRuleInputSchema,
  type ICreateTagRuleInput,
  type ICreateTagRuleWithTagInput,
  type ITagRuleApplyAs,
  type ITagRuleMatchField,
  type ITagRulePatternType,
  type ITagRuleSource,
  type IUpdateTagRuleInput,
} from "./rule-input-schemas";

export {
  CreateTagRuleInputSchema,
  CreateTagRuleWithTagInputSchema,
  TagRuleApplyAsSchema,
  TagRuleMatchFieldSchema,
  TagRulePatternTypeSchema,
  TagRuleSourceSchema,
  UpdateTagRuleInputSchema,
  type ICreateTagRuleInput,
  type ICreateTagRuleWithTagInput,
  type ITagRuleApplyAs,
  type ITagRuleMatchField,
  type ITagRulePatternType,
  type ITagRuleSource,
  type IUpdateTagRuleInput,
};

export const TagRuleSchema = z.object({
  id: z.string(),
  tagId: z.string(),
  tag: TransactionTagSchema.optional(),
  label: z.string().nullable(),
  keywords: z.array(z.string()),
  pattern: z.string().nullable(),
  patternType: TagRulePatternTypeSchema,
  matchFields: z.array(TagRuleMatchFieldSchema).min(1),
  applyAs: TagRuleApplyAsSchema,
  priority: z.number().int(),
  source: TagRuleSourceSchema,
  enabled: z.boolean(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export const TagRulesResponseSchema = z.object({
  data: z.array(TagRuleSchema),
});

export const TagMatchRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  paymentMethod: PaymentMethodSchema.optional(),
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
