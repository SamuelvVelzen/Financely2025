import {
  CreateTagRuleInputSchema,
  TagHistoryDiscoverySchema,
  TagMatchResponseSchema,
  TagRuleSchema,
  UpdateTagRuleInputSchema,
  type ICreateTagRuleInput,
  type IEnableTagRulePresetsInput,
  type ITagHistoryDiscovery,
  type ITagMatchRequest,
  type ITagMatchResponse,
  type ITagRule,
  type ITagSuggestions,
  type ITransactionType,
  type IUpdateTagRuleInput,
} from "@/features/shared/validation/schemas";
import {
  DEFAULT_TAG_RULE_PRESETS,
  getDefaultTagRulePreset,
  getRecommendedTagMetadataForPreset,
  type IDefaultTagRulePreset,
} from "@/features/tag/config/default-tag-rules";
import { TagService } from "@/features/tag/services/tag.service";
import { prisma } from "@/features/util/prisma";
import { WorkspaceSettingService } from "@/features/workspace/services/workspace-setting.service";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { normalizeMerchantText } from "../utils/normalize-merchant-text";

type ITagRuleRow = {
  id: string;
  tagId: string;
  label: string | null;
  keywords: string;
  pattern: string | null;
  patternType: "KEYWORD" | "REGEX";
  matchField: "NAME" | "DESCRIPTION" | "BOTH";
  applyAs: "PRIMARY" | "TAG" | "BOTH";
  priority: number;
  source: "USER" | "SYSTEM" | "LEARNED";
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  tag: {
    id: string;
    name: string;
    color: string | null;
    transactionType: "EXPENSE" | "INCOME";
  };
};

const SOURCE_PRIORITY: Record<ITagRule["source"], number> = {
  USER: 3,
  LEARNED: 2,
  SYSTEM: 1,
};

function parseKeywords(keywordsJson: string): string[] {
  try {
    const parsed = JSON.parse(keywordsJson);
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
}

function serializeKeywords(keywords: string[]): string {
  return JSON.stringify(keywords);
}

function mapTagRule(row: ITagRuleRow): ITagRule {
  return TagRuleSchema.parse({
    id: row.id,
    tagId: row.tagId,
    tag: {
      id: row.tag.id,
      name: row.tag.name,
      color: row.tag.color,
    },
    label: row.label,
    keywords: parseKeywords(row.keywords),
    pattern: row.pattern,
    patternType: row.patternType,
    matchField: row.matchField,
    applyAs: row.applyAs,
    priority: row.priority,
    source: row.source,
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function getHaystack(
  matchField: ITagRule["matchField"],
  name: string,
  description: string | null | undefined,
): string {
  if (matchField === "DESCRIPTION") {
    return description ?? "";
  }
  if (matchField === "BOTH") {
    return `${name} ${description ?? ""}`;
  }
  return name;
}

function matchesRule(
  rule: ITagRuleRow,
  name: string,
  description: string | null | undefined,
): boolean {
  const haystack = getHaystack(rule.matchField, name, description);

  if (rule.patternType === "REGEX" && rule.pattern) {
    try {
      return new RegExp(rule.pattern, "i").test(haystack);
    } catch {
      return false;
    }
  }

  const normalized = normalizeMerchantText(haystack);
  const keywords = parseKeywords(rule.keywords);
  return keywords.some((keyword) =>
    normalized.includes(normalizeMerchantText(keyword)),
  );
}

function sortRules(rules: ITagRuleRow[]): ITagRuleRow[] {
  return [...rules].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return SOURCE_PRIORITY[b.source] - SOURCE_PRIORITY[a.source];
  });
}

function buildSuggestionsFromMatches(
  matches: Array<{
    tagId: string;
    applyAs: ITagRule["applyAs"];
  }>,
): { primaryTagId: string | null; tagIds: string[] } {
  let primaryTagId: string | null = null;
  const tagIds: string[] = [];

  for (const match of matches) {
    if (
      (match.applyAs === "PRIMARY" || match.applyAs === "BOTH") &&
      !primaryTagId
    ) {
      primaryTagId = match.tagId;
    }
    if (
      (match.applyAs === "TAG" || match.applyAs === "BOTH") &&
      !tagIds.includes(match.tagId)
    ) {
      tagIds.push(match.tagId);
    }
  }

  return { primaryTagId, tagIds };
}

async function isSmartTaggingEnabled(
  userId: string,
  workspaceId: IWorkspaceId,
): Promise<boolean> {
  const setting = await WorkspaceSettingService.getWorkspaceSetting(
    userId,
    workspaceId,
  );
  return setting?.smartTaggingEnabled ?? true;
}

async function resolvePresetTagId(
  userId: string,
  workspaceId: IWorkspaceId,
  preset: IDefaultTagRulePreset,
  tagNameOverride?: string,
): Promise<string> {
  const tagName = tagNameOverride ?? preset.tagName;
  const recommended = getRecommendedTagMetadataForPreset(tagName);

  const existing = await prisma.tag.findFirst({
    where: { userId, workspaceId, name: tagName },
  });

  if (existing) {
    const shouldUpdateColor = recommended?.color && !existing.color;
    const shouldUpdateEmoticon = recommended?.emoticon && !existing.emoticon;
    const shouldUpdateDescription =
      recommended?.description && !existing.description;

    if (shouldUpdateColor || shouldUpdateEmoticon || shouldUpdateDescription) {
      await TagService.updateTag(userId, workspaceId, existing.id, {
        ...(shouldUpdateColor && { color: recommended.color }),
        ...(shouldUpdateEmoticon && { emoticon: recommended.emoticon }),
        ...(shouldUpdateDescription && {
          description: recommended.description,
        }),
      });
    }

    return existing.id;
  }

  const created = await TagService.createTag(userId, workspaceId, {
    name: tagName,
    transactionType: preset.transactionType,
    color: recommended?.color ?? null,
    emoticon: recommended?.emoticon ?? null,
    description: recommended?.description ?? null,
  });
  return created.id;
}

export class TagRuleService {
  static async listRules(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<{ data: ITagRule[] }> {
    const rules = await prisma.tagRule.findMany({
      where: { userId, workspaceId },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            transactionType: true,
          },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    return { data: rules.map((rule) => mapTagRule(rule as ITagRuleRow)) };
  }

  static async getRuleById(
    userId: string,
    workspaceId: IWorkspaceId,
    ruleId: string,
  ): Promise<ITagRule | null> {
    const rule = await prisma.tagRule.findFirst({
      where: { id: ruleId, userId, workspaceId },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            transactionType: true,
          },
        },
      },
    });

    return rule ? mapTagRule(rule as ITagRuleRow) : null;
  }

  static async createRule(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ICreateTagRuleInput,
    source: ITagRule["source"] = "USER",
  ): Promise<ITagRule> {
    const validated = CreateTagRuleInputSchema.parse(input);

    const tag = await prisma.tag.findFirst({
      where: { id: validated.tagId, userId, workspaceId },
    });
    if (!tag) {
      throw new Error("Tag not found");
    }

    const rule = await prisma.tagRule.create({
      data: {
        userId,
        workspaceId,
        tagId: validated.tagId,
        label: validated.label ?? null,
        keywords: serializeKeywords(validated.keywords),
        pattern: validated.pattern ?? null,
        patternType: validated.patternType,
        matchField: validated.matchField,
        applyAs: validated.applyAs,
        priority: validated.priority,
        source: validated.source ?? source,
        enabled: validated.enabled,
      },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            transactionType: true,
          },
        },
      },
    });

    return mapTagRule(rule as ITagRuleRow);
  }

  static async updateRule(
    userId: string,
    workspaceId: IWorkspaceId,
    ruleId: string,
    input: IUpdateTagRuleInput,
  ): Promise<ITagRule> {
    const validated = UpdateTagRuleInputSchema.parse(input);

    const existing = await prisma.tagRule.findFirst({
      where: { id: ruleId, userId, workspaceId },
    });
    if (!existing) {
      throw new Error("Tag rule not found");
    }

    if (validated.tagId) {
      const tag = await prisma.tag.findFirst({
        where: { id: validated.tagId, userId, workspaceId },
      });
      if (!tag) {
        throw new Error("Tag not found");
      }
    }

    const rule = await prisma.tagRule.update({
      where: { id: ruleId },
      data: {
        ...(validated.tagId !== undefined && { tagId: validated.tagId }),
        ...(validated.label !== undefined && { label: validated.label }),
        ...(validated.keywords !== undefined && {
          keywords: serializeKeywords(validated.keywords),
        }),
        ...(validated.pattern !== undefined && { pattern: validated.pattern }),
        ...(validated.patternType !== undefined && {
          patternType: validated.patternType,
        }),
        ...(validated.matchField !== undefined && {
          matchField: validated.matchField,
        }),
        ...(validated.applyAs !== undefined && { applyAs: validated.applyAs }),
        ...(validated.priority !== undefined && {
          priority: validated.priority,
        }),
        ...(validated.enabled !== undefined && { enabled: validated.enabled }),
      },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            transactionType: true,
          },
        },
      },
    });

    return mapTagRule(rule as ITagRuleRow);
  }

  static async deleteRule(
    userId: string,
    workspaceId: IWorkspaceId,
    ruleId: string,
  ): Promise<void> {
    const existing = await prisma.tagRule.findFirst({
      where: { id: ruleId, userId, workspaceId },
    });
    if (!existing) {
      throw new Error("Tag rule not found");
    }

    await prisma.tagRule.delete({ where: { id: ruleId } });
  }

  static async matchTransaction(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ITagMatchRequest,
  ): Promise<ITagMatchResponse> {
    const enabled = await isSmartTaggingEnabled(userId, workspaceId);
    if (!enabled) {
      return TagMatchResponseSchema.parse({
        matches: [],
        suggestions: { primaryTagId: null, tagIds: [] },
      });
    }

    const rules = await prisma.tagRule.findMany({
      where: { userId, workspaceId, enabled: true },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            transactionType: true,
          },
        },
      },
    });

    const matchingRules = sortRules(
      (rules as ITagRuleRow[]).filter(
        (rule) =>
          rule.tag.transactionType === input.type &&
          matchesRule(rule, input.name, input.description),
      ),
    );

    const seenApplyAs = new Set<string>();
    const matches = [];

    for (const rule of matchingRules) {
      const key = `${rule.applyAs}:${rule.tagId}`;
      if (seenApplyAs.has(key)) {
        continue;
      }
      seenApplyAs.add(key);

      matches.push({
        ruleId: rule.id,
        ruleLabel: rule.label,
        tagId: rule.tagId,
        tagName: rule.tag.name,
        tagColor: rule.tag.color,
        applyAs: rule.applyAs,
        source: rule.source,
      });
    }

    const suggestions = buildSuggestionsFromMatches(matches);

    return TagMatchResponseSchema.parse({ matches, suggestions });
  }

  static async buildSuggestions(
    userId: string,
    workspaceId: IWorkspaceId,
    input: ITagMatchRequest,
  ): Promise<ITagSuggestions | null> {
    const result = await this.matchTransaction(userId, workspaceId, input);
    const { primaryTagId, tagIds } = result.suggestions;

    if (!primaryTagId && tagIds.length === 0) {
      return null;
    }

    const primaryMatch = result.matches.find(
      (match) =>
        match.tagId === primaryTagId &&
        (match.applyAs === "PRIMARY" || match.applyAs === "BOTH"),
    );

    return {
      primaryTagId,
      tagIds,
      suggested: true,
      primaryRule: primaryMatch
        ? {
            ruleId: primaryMatch.ruleId,
            ruleLabel: primaryMatch.ruleLabel,
            source: primaryMatch.source,
          }
        : null,
    };
  }

  static async attachSuggestionsToCandidates(
    userId: string,
    workspaceId: IWorkspaceId,
    candidates: Array<{
      data: {
        name: string;
        description?: string | null;
        type: ITransactionType;
        primaryTagId?: string | null;
        tagIds?: string[];
      };
      tagSuggestions?: ITagSuggestions | null;
    }>,
  ): Promise<void> {
    const enabled = await isSmartTaggingEnabled(userId, workspaceId);
    if (!enabled) {
      return;
    }

    for (const candidate of candidates) {
      const hasPrimaryTag = Boolean(candidate.data.primaryTagId);
      const hasTags =
        Array.isArray(candidate.data.tagIds) &&
        candidate.data.tagIds.length > 0;
      if (hasPrimaryTag || hasTags || !candidate.data.type) {
        continue;
      }

      const suggestions = await this.buildSuggestions(userId, workspaceId, {
        name: candidate.data.name,
        description: candidate.data.description,
        type: candidate.data.type,
      });

      if (suggestions) {
        candidate.tagSuggestions = suggestions;
        if (suggestions.primaryTagId) {
          candidate.data.primaryTagId = suggestions.primaryTagId;
        }
        if (suggestions.tagIds.length > 0) {
          candidate.data.tagIds = suggestions.tagIds;
        }
      }
    }
  }

  static async enablePresets(
    userId: string,
    workspaceId: IWorkspaceId,
    input: IEnableTagRulePresetsInput,
  ): Promise<{ data: ITagRule[] }> {
    const created: ITagRule[] = [];

    for (const presetId of input.presetIds) {
      const preset = getDefaultTagRulePreset(presetId);
      if (!preset) {
        continue;
      }

      const existing = await prisma.tagRule.findFirst({
        where: {
          userId,
          workspaceId,
          source: "SYSTEM",
          label: preset.label,
        },
      });
      if (existing) {
        const rule = await this.getRuleById(userId, workspaceId, existing.id);
        if (rule) {
          created.push(rule);
        }
        continue;
      }

      const tagName = input.tagNameMap?.[presetId] ?? preset.tagName;
      const tagId = await resolvePresetTagId(
        userId,
        workspaceId,
        preset,
        tagName,
      );

      const rule = await this.createRule(
        userId,
        workspaceId,
        {
          tagId,
          label: preset.label,
          keywords: preset.keywords,
          patternType: "KEYWORD",
          matchField: "NAME",
          applyAs: "PRIMARY",
          priority: preset.priority,
          enabled: true,
        },
        "SYSTEM",
      );
      created.push(rule);
    }

    return { data: created };
  }

  static async discoverFromHistory(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<{ data: ITagHistoryDiscovery[] }> {
    const setting = await WorkspaceSettingService.getWorkspaceSetting(
      userId,
      workspaceId,
    );
    if (setting && !setting.historyLearningEnabled) {
      return { data: [] };
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        workspaceId,
        transactionDate: { gte: twelveMonthsAgo },
        OR: [{ primaryTagId: { not: null } }, { tags: { some: {} } }],
      },
      select: {
        name: true,
        primaryTagId: true,
        primaryTag: {
          select: { id: true, name: true },
        },
        tags: {
          select: { id: true, name: true },
        },
      },
    });

    const existingRules = await prisma.tagRule.findMany({
      where: { userId, workspaceId },
      select: { keywords: true },
    });
    const existingKeywords = new Set<string>();
    for (const rule of existingRules) {
      for (const keyword of parseKeywords(rule.keywords)) {
        existingKeywords.add(normalizeMerchantText(keyword));
      }
    }

    const groups = new Map<
      string,
      { tagId: string; tagName: string; count: number; total: number }
    >();

    for (const tx of transactions) {
      const normalizedName = normalizeMerchantText(tx.name);
      if (!normalizedName || existingKeywords.has(normalizedName)) {
        continue;
      }

      const tagId = tx.primaryTagId ?? tx.tags[0]?.id;
      const tagName = tx.primaryTag?.name ?? tx.tags[0]?.name;
      if (!tagId || !tagName) {
        continue;
      }

      const current = groups.get(normalizedName) ?? {
        tagId,
        tagName,
        count: 0,
        total: 0,
      };
      current.total += 1;
      if (tagId === current.tagId) {
        current.count += 1;
      } else if (current.total === 1) {
        current.tagId = tagId;
        current.tagName = tagName;
        current.count = 1;
      }
      groups.set(normalizedName, current);
    }

    const discoveries: ITagHistoryDiscovery[] = [];

    for (const [keyword, group] of groups) {
      if (group.total < 3) {
        continue;
      }
      const confidence = group.count / group.total;
      if (confidence < 0.8) {
        continue;
      }

      discoveries.push(
        TagHistoryDiscoverySchema.parse({
          keyword,
          tagId: group.tagId,
          tagName: group.tagName,
          count: group.count,
          confidence,
        }),
      );
    }

    discoveries.sort((a, b) => b.count - a.count);

    return { data: discoveries };
  }

  static listAvailablePresets() {
    return DEFAULT_TAG_RULE_PRESETS;
  }
}
