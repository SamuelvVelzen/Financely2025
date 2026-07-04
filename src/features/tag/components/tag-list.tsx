import type { ITag } from "@/features/shared/validation/schemas";
import { DraggableTagListItem } from "@/features/tag/components/draggable-tag-list-item";
import { TagListItem } from "@/features/tag/components/tag-list-item";
import { SortableList } from "@/features/ui/list/sortable-list";
import { SortableListItem } from "@/features/ui/list/sortable-list-item";

type ITagListProps = {
  data: ITag[];
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onEditRules?: (tag: ITag) => void;
  onViewTransactions?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
  onOrderChange?: (orderedIds: (string | number)[]) => void;
  /** Whether dragging/reordering is enabled. Defaults to false. */
  draggable?: boolean;
};

export function TagList({
  data,
  searchQuery,
  onEdit,
  onEditRules,
  onViewTransactions,
  onDelete,
  onOrderChange,
  draggable = false,
}: ITagListProps) {
  const listProps = {
    data,
    getItemId: (tag: ITag) => tag.id,
  };

  if (draggable) {
    return (
      <SortableList {...listProps} draggable onOrderChange={onOrderChange}>
        {(tag, _index, dragProps) => (
          <DraggableTagListItem
            tag={tag}
            searchQuery={searchQuery}
            onEdit={onEdit}
            onEditRules={onEditRules}
            onViewTransactions={onViewTransactions}
            onDelete={onDelete}
            dragProps={dragProps}
          />
        )}
      </SortableList>
    );
  }

  return (
    <SortableList {...listProps} draggable={false}>
      {(tag) => (
        <SortableListItem
          draggable={false}
          clicked={onEdit ? () => onEdit(tag) : undefined}>
          <TagListItem
            tag={tag}
            searchQuery={searchQuery}
            onEdit={onEdit}
            onEditRules={onEditRules}
            onViewTransactions={onViewTransactions}
            onDelete={onDelete}
          />
        </SortableListItem>
      )}
    </SortableList>
  );
}
