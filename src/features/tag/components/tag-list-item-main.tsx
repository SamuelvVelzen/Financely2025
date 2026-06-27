import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITag } from "@/features/shared/validation/schemas";
import { TagInline } from "@/features/tag/components/tag-inline";

type ITagListItemMainProps = {
  tag: ITag;
  searchQuery?: string;
};

export function TagListItemMain({ tag, searchQuery }: ITagListItemMainProps) {
  const { highlightText } = useHighlightText();

  return (
    <div className="flex items-center gap-3">
      <TagInline
        tag={tag}
        searchQuery={searchQuery}
        showColorDot
        colorDotClassName="size-4 rounded"
        emoticonClassName="text-lg"
      />
      {tag.description && (
        <span className="text-sm text-text-muted">
          {highlightText(tag.description, searchQuery)}
        </span>
      )}
    </div>
  );
}
