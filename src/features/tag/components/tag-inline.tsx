import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import type { ITagDisplayData } from "./tag-display";

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
