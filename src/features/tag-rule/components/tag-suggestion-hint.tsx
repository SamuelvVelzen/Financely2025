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
  compact?: boolean;
};

export function TagSuggestionHint({
  tagSuggestions,
  currentPrimaryTagId,
  onRevert,
  compact = false,
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
  const ruleTitle = ruleLabel
    ? `Matched ${ruleSourceLabel}: ${ruleLabel}`
    : undefined;

  if (compact) {
    return (
      <div className="flex items-center gap-1 min-w-0 text-[11px] leading-tight">
        <Badge
          variant="info"
          className="text-[10px] px-1 py-0 h-4 shrink-0">
          Suggested
        </Badge>
        {ruleLabel && (
          <span
            className="text-text-muted truncate"
            title={ruleTitle}>
            {ruleLabel}
          </span>
        )}
        {hasChangedFromSuggestion && onRevert && (
          <LinkButton
            size="xs"
            clicked={onRevert}
            buttonContent="Revert"
            className="ml-auto"
          />
        )}
      </div>
    );
  }

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
