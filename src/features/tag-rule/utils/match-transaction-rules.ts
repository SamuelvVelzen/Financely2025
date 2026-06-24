import type {
  ITagMatchRequest,
  ITagMatchResponse,
  ITagRule,
  ITagSuggestions,
  ITransactionType,
} from "@/features/shared/validation/schemas";
import {
  buildMatchHaystack,
  type ITagRuleMatchContext,
} from "./match-fields";
import { normalizeMerchantText } from "./normalize-merchant-text";

const SOURCE_PRIORITY: Record<ITagRule["source"], number> = {
  USER: 3,
  LEARNED: 2,
  SYSTEM: 1,
};

function matchesRule(
  rule: ITagRule,
  context: ITagRuleMatchContext,
): boolean {
  const haystack = buildMatchHaystack(rule.matchFields, context);

  if (rule.patternType === "REGEX" && rule.pattern) {
    try {
      return new RegExp(rule.pattern, "i").test(haystack);
    } catch {
      return false;
    }
  }

  const normalized = normalizeMerchantText(haystack);
  return rule.keywords.some((keyword) =>
    normalized.includes(normalizeMerchantText(keyword)),
  );
}

function sortRules(rules: ITagRule[]): ITagRule[] {
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

export function buildTagSuggestionsFromMatch(
  result: ITagMatchResponse,
): ITagSuggestions | null {
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

export function matchTransactionAgainstRules(
  rules: ITagRule[],
  input: ITagMatchRequest,
  tagTransactionTypes: ReadonlyMap<string, ITransactionType>,
): ITagMatchResponse {
  const context: ITagRuleMatchContext = {
    name: input.name,
    description: input.description,
    notes: input.notes,
    paymentMethod: input.paymentMethod ?? null,
    type: input.type,
  };

  const matchingRules = sortRules(
    rules.filter((rule) => {
      if (!rule.enabled) {
        return false;
      }
      const tagType = tagTransactionTypes.get(rule.tagId);
      if (tagType && tagType !== input.type) {
        return false;
      }
      return matchesRule(rule, context);
    }),
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
      tagName: rule.tag?.name ?? "",
      tagColor: rule.tag?.color ?? null,
      applyAs: rule.applyAs,
      source: rule.source,
    });
  }

  const suggestions = buildSuggestionsFromMatches(matches);
  return { matches, suggestions };
}
