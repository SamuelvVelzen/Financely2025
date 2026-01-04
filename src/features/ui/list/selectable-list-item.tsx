import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";
import { ListItem } from "./list-item";

type ISelectableListItemProps = {
  checked: boolean;
  onChange: () => void;
  checkboxId?: string;
  clicked?: () => void;
  isSelected?: boolean;
} & PropsWithChildren &
  IPropsWithClassName;

export function SelectableListItem({
  children,
  className = "",
  checked,
  onChange,
  checkboxId,
  clicked,
  isSelected,
}: ISelectableListItemProps) {
  const selected = isSelected ?? checked;

  return (
    <ListItem
      className={cn(
        "p-0 cursor-pointer relative",
        "hover:bg-surface-hover/50",
        selected && "bg-primary/5 is-selected",
        // Base borders for unselected items
        !selected && "border-l border-r border-border",
        // First item styling (using CSS :first-child)
        !selected &&
          "[li:first-child_&]:rounded-t-2xl [li:first-child_&]:border-t",
        // Last item styling (using CSS :last-child)
        !selected &&
          "[li:last-child_&]:rounded-b-2xl [li:last-child_&]:border-b",
        // Dividers between items (not first)
        !selected &&
          "[li:not(:first-child)_&]:border-t [li:not(:first-child)_&]:border-border",
        // Selected item borders - completely override base borders
        selected &&
          "border-0! border-l! border-r! border-t! border-b! border-primary!",
        // First/last item styling for selected items (using CSS)
        selected && "[li:first-child_&]:rounded-t-2xl",
        selected && "[li:last-child_&]:rounded-b-2xl",
        // Remove top border when parent li comes after another li with is-selected class
        // This keeps the bottom border of the first selected item, creating a single border between them
        "[.is-selected+.is-selected_&]:border-t-0!",
        className
      )}
      clicked={clicked}>
      <label
        htmlFor={checkboxId}
        className="flex items-center gap-3 px-3 py-2.5 w-full cursor-pointer">
        <Checkbox
          id={checkboxId}
          checked={checked}
          onChange={onChange}
        />
        {children}
      </label>
    </ListItem>
  );
}
