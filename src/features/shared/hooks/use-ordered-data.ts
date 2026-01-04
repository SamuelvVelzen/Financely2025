import { useMemo } from "react";

/**
 * Type constraint for items that have an order property
 */
type HasOrder = {
  order: number;
};

/**
 * Hook that sorts data by the `order` property
 *
 * @example
 * ```tsx
 * const tags = useTags();
 * const orderedTags = useOrderedData(tags.data?.data ?? []);
 * ```
 *
 * @example
 * ```tsx
 * interface MyItem {
 *   id: string;
 *   name: string;
 *   order: number;
 * }
 *
 * const items: MyItem[] = [
 *   { id: "1", name: "Second", order: 1 },
 *   { id: "2", name: "First", order: 0 },
 * ];
 *
 * const ordered = useOrderedData(items);
 * // Returns: [{ id: "2", name: "First", order: 0 }, { id: "1", name: "Second", order: 1 }]
 * ```
 */
export function useOrderedData<T extends HasOrder>(data: T[]): T[] {
  return useMemo(() => {
    return [...data].sort((a, b) => a.order - b.order);
  }, [data]);
}
