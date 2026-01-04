import { cn } from "@/features/util/cn";
import { ReactElement, ReactNode, cloneElement, isValidElement } from "react";
import { IListProps } from "./list";
import { SelectableListItem } from "./selectable-list-item";

type ISelectableListProps<T> = Omit<IListProps<T>, "data" | "children"> & {
  data: T[];
  selectedIds: (string | number)[];
  onSelectionChange: (selectedIds: (string | number)[]) => void;
  getItemId: (item: T) => string | number;
  children: (
    item: T,
    index: number,
    selectionProps: {
      checked: boolean;
      onChange: () => void;
      checkboxId: string;
    }
  ) => ReactNode;
};

function injectSelectableListItemProps(
  element: ReactNode,
  isSelected: boolean
): ReactNode {
  if (!isValidElement(element)) {
    return element;
  }

  const elementType = element.type as any;
  const displayName = elementType?.displayName || elementType?.name;

  // Check if it's a SelectableListItem
  const isSelectableListItem =
    displayName === "SelectableListItem" || element.type === SelectableListItem;

  if (isSelectableListItem) {
    return cloneElement(element as ReactElement<any>, {
      isSelected,
    });
  }

  // If it has children, recursively check them
  const props = element.props as { children?: ReactNode };
  if (props?.children) {
    const children = Array.isArray(props.children)
      ? props.children.map((child: ReactNode) =>
          injectSelectableListItemProps(child, isSelected)
        )
      : injectSelectableListItemProps(props.children, isSelected);

    return cloneElement(element as ReactElement<any>, { children });
  }

  return element;
}

export function SelectableList<T>({
  data,
  children,
  selectedIds,
  onSelectionChange,
  getItemId,
  className,
  getItemKey,
}: ISelectableListProps<T>) {
  const handleToggle = (itemId: string | number) => {
    const current = [...selectedIds];
    const index = current.indexOf(itemId);

    if (index > -1) {
      // Remove from selection
      current.splice(index, 1);
    } else {
      // Add to selection
      current.push(itemId);
    }

    onSelectionChange(current);
  };

  return (
    <ul
      className={cn("overflow-hidden list-none", className)}
      role="list">
      {data.map((item, index) => {
        const itemId = getItemId(item);
        const checked = selectedIds.includes(itemId);
        const checkboxId = `selectable-item-${itemId}`;

        const selectionProps = {
          checked,
          onChange: () => handleToggle(itemId),
          checkboxId,
        };

        const child = children(item, index, selectionProps);
        const injectedChild = injectSelectableListItemProps(child, checked);

        const key = getItemKey
          ? getItemKey(item, index)
          : typeof item === "object" &&
              item !== null &&
              "id" in item &&
              (typeof (item as { id?: unknown }).id === "string" ||
                typeof (item as { id?: unknown }).id === "number")
            ? (item as { id: string | number }).id
            : index;

        return (
          <li
            key={key}
            className={checked ? "is-selected" : undefined}>
            {injectedChild}
          </li>
        );
      })}
    </ul>
  );
}
