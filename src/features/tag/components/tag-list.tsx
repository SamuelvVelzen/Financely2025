import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITag } from "@/features/shared/validation/schemas";
import { IconButton } from "@/features/ui/button/icon-button";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import {
  SortableList,
  type ISortableListDragProps,
} from "@/features/ui/list/sortable-list";
import { SortableListItem } from "@/features/ui/list/sortable-list-item";
import { HiPencil, HiTrash } from "react-icons/hi2";

type ITagListProps = {
  data: ITag[];
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
  onOrderChange?: (orderedIds: (string | number)[]) => void;
  /** Whether dragging/reordering is enabled. Defaults to false. */
  draggable?: boolean;
};

function TagListItemContent({
  tag,
  searchQuery,
  onEdit,
  onDelete,
}: {
  tag: ITag;
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
}) {
  const { highlightText } = useHighlightText();

  return (
    <>
      <div className="flex items-center gap-3">
        {tag.emoticon && <span className="text-lg">{tag.emoticon}</span>}
        {tag.color && (
          <div
            className="size-4 rounded"
            style={{ backgroundColor: tag.color }}
          />
        )}
        <span className="text-text">{highlightText(tag.name, searchQuery)}</span>
        {tag.description && (
          <span className="text-sm text-text-muted">
            {highlightText(tag.description, searchQuery)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 focus-within:opacity-100 motion-safe:transition-opacity">
        {onEdit && (
          <IconButton clicked={() => onEdit(tag)} size="sm">
            <HiPencil className="size-4" />
          </IconButton>
        )}
        {onDelete && (
          <Dropdown size="sm">
            <DropdownItem
              icon={<HiTrash className="size-4" />}
              text="Delete"
              clicked={() => onDelete(tag.id)}
              className="text-danger hover:bg-danger/10"
            />
          </Dropdown>
        )}
      </div>
    </>
  );
}

function DraggableTagListItem({
  tag,
  searchQuery,
  onEdit,
  onDelete,
  dragProps,
}: {
  tag: ITag;
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
  dragProps: ISortableListDragProps;
}) {
  return (
    <SortableListItem
      className="group"
      draggable
      isDragging={dragProps.isDragging}
      isDragOver={dragProps.isDragOver}
      isOriginalPosition={dragProps.isOriginalPosition}
      draggedItemHeight={dragProps.draggedItemHeight}
      onDragStart={dragProps.onDragStart}
      onDragOver={dragProps.onDragOver}
      onDragEnd={dragProps.onDragEnd}
      onDrop={dragProps.onDrop}>
      <TagListItemContent
        tag={tag}
        searchQuery={searchQuery}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </SortableListItem>
  );
}

export function TagList({
  data,
  searchQuery,
  onEdit,
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
        <SortableListItem className="group" draggable={false}>
          <TagListItemContent
            tag={tag}
            searchQuery={searchQuery}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </SortableListItem>
      )}
    </SortableList>
  );
}
