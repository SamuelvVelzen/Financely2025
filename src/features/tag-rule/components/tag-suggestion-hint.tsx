import type { ITagSuggestions } from "@/features/shared/validation/schemas";
import { Badge } from "@/features/ui/badge/badge";
import { LinkButton } from "@/features/ui/button/link-button";

const SOURCE_LABELS: Record<
  NonNullable<ITagSuggestions["primaryRule"]>["source"],
  string
> = {
  USER: "rule",
  SYSTEM: "preset",
  LEARNED: "history rule",
};

type ITagSuggestionHintProps = {
  tagSuggestions?: ITagSuggestions | null;
  currentPrimaryTagId?: string | null;
  onRevert?: () => void;
};

export function TagSuggestionHint({
  tagSuggestions,
  currentPrimaryTagId,
  onRevert,
}: ITagSuggestionHintProps) {
  if (!tagSuggestions?.suggested) {
    return null;
  }

  const suggestedPrimaryTagId = tagSuggestions.primaryTagId;
  const hasChangedFromSuggestion =
    !!suggestedPrimaryTagId &&
    currentPrimaryTagId !== suggestedPrimaryTagId;
  const ruleLabel = tagSuggestions.primaryRule?.ruleLabel?.trim();
  const ruleSource = tagSuggestions.primaryRule?.source;
  const ruleSourceLabel = ruleSource ? SOURCE_LABELS[ruleSource] : "rule";

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge variant="info">Suggested</Badge>
      {ruleLabel && (
        <span className="text-xs text-text-muted">
          Matched {ruleSourceLabel}: {ruleLabel}
        </span>
      )}
      {hasChangedFromSuggestion && onRevert && (
        <LinkButton
          clicked={onRevert}
          buttonContent="Revert to suggested"
          className="text-xs"
        />
      )}
    </div>
  );
}
