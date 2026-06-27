import type { ITag } from "@/features/shared/validation/schemas";
import { TagListItemActions } from "@/features/tag/components/tag-list-item-actions";
import { TagListItemMain } from "@/features/tag/components/tag-list-item-main";
import {
  type ISortableListDragProps,
} from "@/features/ui/list/sortable-list";
import { SortableListItem } from "@/features/ui/list/sortable-list-item";

type IDraggableTagListItemProps = {
  tag: ITag;
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onEditRules?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
  dragProps: ISortableListDragProps;
};

export function DraggableTagListItem({
  tag,
  searchQuery,
  onEdit,
  onEditRules,
  onDelete,
  dragProps,
}: IDraggableTagListItemProps) {
  return (
    <SortableListItem
      draggable
      clicked={onEdit ? () => onEdit(tag) : undefined}
      isDragging={dragProps.isDragging}
      isDragOver={dragProps.isDragOver}
      isOriginalPosition={dragProps.isOriginalPosition}
      draggedItemHeight={dragProps.draggedItemHeight}
      onDragStart={dragProps.onDragStart}
      onDragOver={dragProps.onDragOver}
      onDragEnd={dragProps.onDragEnd}
      onDrop={dragProps.onDrop}>
      <TagListItemMain tag={tag} searchQuery={searchQuery} />
      <TagListItemActions
        tag={tag}
        onEdit={onEdit}
        onEditRules={onEditRules}
        onDelete={onDelete}
      />
    </SortableListItem>
  );
}
