import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITag } from "@/features/shared/validation/schemas";
import { IconButton } from "@/features/ui/button/icon-button";
import { SortableList } from "@/features/ui/list/sortable-list";
import { SortableListItem } from "@/features/ui/list/sortable-list-item";
import { HiPencil, HiTrash } from "react-icons/hi2";

type ITagListProps = {
  data: ITag[];
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
  onOrderChange?: (orderedIds: (string | number)[]) => void;
};

export function TagList({
  data,
  searchQuery,
  onEdit,
  onDelete,
  onOrderChange,
}: ITagListProps) {
  const { highlightText } = useHighlightText();

  return (
    <SortableList
      data={data}
      getItemId={(tag) => tag.id}
      onOrderChange={onOrderChange}>
      {(tag: ITag, index, dragProps) => (
        <SortableListItem
          className="group"
          draggable={true}
          isDragging={dragProps.isDragging}
          isDragOver={dragProps.isDragOver}
          isOriginalPosition={dragProps.isOriginalPosition}
          draggedItemHeight={dragProps.draggedItemHeight}
          onDragStart={dragProps.onDragStart}
          onDragOver={dragProps.onDragOver}
          onDragEnd={dragProps.onDragEnd}
          onDrop={dragProps.onDrop}>
          <div className="flex items-center gap-3">
            {tag.emoticon && (
              <span className="text-lg">{tag.emoticon}</span>
            )}
            {tag.color && (
              <div
                className="size-4 rounded"
                style={{ backgroundColor: tag.color }}
              />
            )}
            <span className="text-text">
              {highlightText(tag.name, searchQuery)}
            </span>
            {tag.description && (
              <span className="text-sm text-text-muted">
                {highlightText(tag.description, searchQuery)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 motion-safe:transition-opacity">
            {onEdit && (
              <IconButton clicked={() => onEdit(tag)}>
                <HiPencil className="size-5" />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                clicked={() => onDelete(tag.id)}
                className="text-danger hover:text-danger-hover">
                <HiTrash className="size-5" />
              </IconButton>
            )}
          </div>
        </SortableListItem>
      )}
    </SortableList>
  );
}
