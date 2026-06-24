import { useHighlightText } from "@/features/shared/hooks/useHighlightText";
import type { ITag } from "@/features/shared/validation/schemas";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import {
  SortableList,
  type ISortableListDragProps,
} from "@/features/ui/list/sortable-list";
import { SortableListItem } from "@/features/ui/list/sortable-list-item";
import { HiOutlineQueueList, HiPencil, HiTrash } from "react-icons/hi2";

type ITagListProps = {
  data: ITag[];
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onEditRules?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
  onOrderChange?: (orderedIds: (string | number)[]) => void;
  /** Whether dragging/reordering is enabled. Defaults to false. */
  draggable?: boolean;
};

function TagListItemMain({
  tag,
  searchQuery,
}: {
  tag: ITag;
  searchQuery?: string;
}) {
  const { highlightText } = useHighlightText();

  return (
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
  );
}

function TagListItemActions({
  tag,
  onEdit,
  onEditRules,
  onDelete,
}: {
  tag: ITag;
  onEdit?: (tag: ITag) => void;
  onEditRules?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
}) {
  const hasDropdownActions = onEdit || onEditRules || onDelete;

  if (!hasDropdownActions) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-1"
      role="toolbar"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}>
      <Dropdown size="sm">
        {onEdit && (
          <DropdownItem
            icon={<HiPencil className="size-4" />}
            text="Edit"
            clicked={() => onEdit(tag)}
          />
        )}
        {onEditRules && (
          <DropdownItem
            icon={<HiOutlineQueueList className="size-4" />}
            text="Tagging rules"
            clicked={() => onEditRules(tag)}
          />
        )}
        {onDelete && (
          <DropdownItem
            icon={<HiTrash className="size-4" />}
            text="Delete"
            clicked={() => onDelete(tag.id)}
            className="text-danger hover:bg-danger/10"
          />
        )}
      </Dropdown>
    </div>
  );
}

function TagListItem({
  tag,
  searchQuery,
  onEdit,
  onEditRules,
  onDelete,
}: {
  tag: ITag;
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onEditRules?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
}) {
  return (
    <>
      <TagListItemMain tag={tag} searchQuery={searchQuery} />
      <TagListItemActions
        tag={tag}
        onEdit={onEdit}
        onEditRules={onEditRules}
        onDelete={onDelete}
      />
    </>
  );
}

function DraggableTagListItem({
  tag,
  searchQuery,
  onEdit,
  onEditRules,
  onDelete,
  dragProps,
}: {
  tag: ITag;
  searchQuery?: string;
  onEdit?: (tag: ITag) => void;
  onEditRules?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
  dragProps: ISortableListDragProps;
}) {
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

export function TagList({
  data,
  searchQuery,
  onEdit,
  onEditRules,
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
            onDelete={onDelete}
          />
        </SortableListItem>
      )}
    </SortableList>
  );
}
