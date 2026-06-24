import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { Badge, type IBadgeProps } from "@/features/ui/badge/badge";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import type { ReactNode } from "react";

export type ITagDisplayData = {
  name: string;
  emoticon?: string | null;
  color?: string | null;
};

export function formatTagLabel(tag: ITagDisplayData): string {
  return tag.emoticon ? `${tag.emoticon} ${tag.name}` : tag.name;
}

type ITagInlineProps = IPropsWithClassName & {
  tag: ITagDisplayData;
  searchQuery?: string;
  showColorDot?: boolean;
  colorDotClassName?: string;
  emoticonClassName?: string;
  nameClassName?: string;
};

export function TagInline({
  tag,
  searchQuery,
  showColorDot = false,
  colorDotClassName,
  emoticonClassName = "text-base",
  nameClassName,
  className,
}: ITagInlineProps) {
  const { highlightText } = useHighlightText();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 min-w-0 max-w-full",
        className,
      )}>
      {tag.emoticon && (
        <span className={cn("shrink-0", emoticonClassName)}>{tag.emoticon}</span>
      )}
      {showColorDot && tag.color && (
        <span
          className={cn("size-2.5 rounded-full shrink-0", colorDotClassName)}
          style={{ backgroundColor: tag.color }}
        />
      )}
      <span className={cn("truncate", nameClassName)}>
        {searchQuery ? highlightText(tag.name, searchQuery) : tag.name}
      </span>
    </span>
  );
}

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
