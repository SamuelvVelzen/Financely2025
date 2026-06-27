import type { ITag } from "@/features/shared/validation/schemas";
import { Dropdown } from "@/features/ui/dropdown/dropdown";
import { DropdownItem } from "@/features/ui/dropdown/dropdown-item";
import { HiOutlineQueueList, HiPencil, HiTrash } from "react-icons/hi2";

type ITagListItemActionsProps = {
  tag: ITag;
  onEdit?: (tag: ITag) => void;
  onEditRules?: (tag: ITag) => void;
  onDelete?: (tagId: string) => void;
};

export function TagListItemActions({
  tag,
  onEdit,
  onEditRules,
  onDelete,
}: ITagListItemActionsProps) {
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
