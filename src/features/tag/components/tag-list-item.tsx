import type { ITag } from "@/features/shared/validation/schemas";
import { TagListItemActions } from "@/features/tag/components/tag-list-item-actions";
import { TagListItemMain } from "@/features/tag/components/tag-list-item-main";

type ITagListItemProps = {
  tag: ITag;
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onEditRules?: (tag: ITag) => void;
  onViewTransactions?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
};

export function TagListItem({
  tag,
  searchQuery,
  onEdit,
  onEditRules,
  onViewTransactions,
  onDelete,
}: ITagListItemProps) {
  return (
    <>
      <TagListItemMain tag={tag} searchQuery={searchQuery} />
      <TagListItemActions
        tag={tag}
        onEdit={onEdit}
        onEditRules={onEditRules}
        onViewTransactions={onViewTransactions}
        onDelete={onDelete}
      />
    </>
  );
}
