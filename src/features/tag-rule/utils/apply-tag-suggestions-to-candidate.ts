import type {
  ICsvCandidateTransaction,
  ITag,
  ITagRule,
  ITagSuggestions,
} from "@/features/shared/validation/schemas";
import {
  buildTagSuggestionsFromMatch,
  matchTransactionAgainstRules,
} from "./match-transaction-rules";

function tagIdsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function candidateMatchesSuggestion(
  candidate: ICsvCandidateTransaction,
  suggestion: ITagSuggestions | null | undefined,
): boolean {
  if (!suggestion?.suggested) {
    return false;
  }

  return (
    candidate.data.primaryTagId === suggestion.primaryTagId &&
    tagIdsEqual(candidate.data.tagIds, suggestion.tagIds)
  );
}

function shouldApplySuggestion(candidate: ICsvCandidateTransaction): boolean {
  const hasPrimaryTag = Boolean(candidate.data.primaryTagId);
  const hasTags = candidate.data.tagIds.length > 0;

  if (!hasPrimaryTag && !hasTags) {
    return true;
  }

  return candidateMatchesSuggestion(candidate, candidate.tagSuggestions);
}

function metadataFromRule(rule: ITagRule | undefined) {
  if (!rule?.tag) {
    return null;
  }

  return {
    id: rule.tag.id,
    name: rule.tag.name,
    color: rule.tag.color,
    emoticon: null,
  };
}

function enrichMetadata(
  candidate: ICsvCandidateTransaction,
  suggestion: ITagSuggestions,
  rules: ITagRule[],
): Pick<
  ICsvCandidateTransaction,
  "primaryTagMetadata" | "tagsMetadata"
> {
  let primaryTagMetadata = candidate.primaryTagMetadata;
  const tagsMetadata = [...candidate.tagsMetadata];

  if (suggestion.primaryTagId) {
    const rule = rules.find((item) => item.tagId === suggestion.primaryTagId);
    const metadata = metadataFromRule(rule);
    if (metadata) {
      primaryTagMetadata = metadata;
    } else if (!primaryTagMetadata?.id) {
      primaryTagMetadata = {
        id: suggestion.primaryTagId,
        name: rule?.tag?.name ?? "",
        color: rule?.tag?.color ?? null,
        emoticon: null,
      };
    }
  }

  for (const tagId of suggestion.tagIds) {
    if (tagsMetadata.some((meta) => meta.id === tagId)) {
      continue;
    }
    const rule = rules.find((item) => item.tagId === tagId);
    const metadata = metadataFromRule(rule);
    tagsMetadata.push(
      metadata ?? {
        id: tagId,
        name: rule?.tag?.name ?? "",
        color: rule?.tag?.color ?? null,
        emoticon: null,
      },
    );
  }

  return { primaryTagMetadata, tagsMetadata };
}

export function applyTagSuggestionsToCandidate(
  candidate: ICsvCandidateTransaction,
  rules: ITagRule[],
  tagTransactionTypes: ReadonlyMap<string, ITag["transactionType"]>,
): ICsvCandidateTransaction {
  if (!candidate.data.type || !candidate.data.name.trim()) {
    return { ...candidate, tagSuggestions: null };
  }

  const matchResult = matchTransactionAgainstRules(
    rules,
    {
      name: candidate.data.name,
      description: candidate.data.description,
      notes: candidate.data.notes,
      paymentMethod: candidate.data.paymentMethod ?? undefined,
      type: candidate.data.type,
    },
    tagTransactionTypes,
  );

  const suggestion = buildTagSuggestionsFromMatch(matchResult);
  if (!suggestion) {
    return { ...candidate, tagSuggestions: null };
  }

  if (!shouldApplySuggestion(candidate)) {
    return { ...candidate, tagSuggestions: suggestion };
  }

  const metadata = enrichMetadata(candidate, suggestion, rules);

  return {
    ...candidate,
    tagSuggestions: suggestion,
    ...metadata,
    data: {
      ...candidate.data,
      primaryTagId: suggestion.primaryTagId,
      tagIds: suggestion.tagIds,
    },
  };
}

export function applyTagSuggestionsToCandidates(
  candidates: ICsvCandidateTransaction[],
  rules: ITagRule[],
  tagTransactionTypes: ReadonlyMap<string, ITag["transactionType"]>,
): ICsvCandidateTransaction[] {
  return candidates.map((candidate) =>
    applyTagSuggestionsToCandidate(candidate, rules, tagTransactionTypes),
  );
}
