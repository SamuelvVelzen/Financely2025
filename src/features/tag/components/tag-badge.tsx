import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { Badge, type IBadgeProps } from "@/features/ui/badge/badge";
import type { ReactNode } from "react";
import type { ITagDisplayData } from "./tag-display";

type ITagBadgeProps = {
  tag: ITagDisplayData;
  searchQuery?: string;
  className?: string;
  tooltip?: ReactNode;
  tooltipPlacement?: IBadgeProps["tooltipPlacement"];
};

export function TagBadge({
  tag,
  searchQuery,
  className,
  tooltip,
  tooltipPlacement,
}: ITagBadgeProps) {
  const { highlightText } = useHighlightText();

  return (
    <Badge
      backgroundColor={tag.color ?? undefined}
      className={className}
      tooltip={tooltip}
      tooltipPlacement={tooltipPlacement}>
      {tag.emoticon && <span className="shrink-0">{tag.emoticon}</span>}
      {searchQuery ? highlightText(tag.name, searchQuery) : tag.name}
    </Badge>
  );
}
