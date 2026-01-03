import type { ITag } from "@/features/shared/validation/schemas";
import {
  formatDateRange,
  formatMonthYear,
} from "@/features/util/date/date-helpers";
import type { IFilterState } from "../../transaction/hooks/useTransactionFilters";
import { DEFAULT_FILTER_STATE } from "./transaction-filter-model";

export interface IFilterBadge {
  id: string;
  type: "date" | "tag" | "amount" | "search";
  label: string;
  value: string;
  onRemove: () => void;
  color?: string; // For tag badges
}

interface IGenerateBadgesOptions {
  filterState: IFilterState;
  tags?: ITag[];
  onRemoveDate: () => void;
  onRemoveTag: (tagId: string) => void;
  onRemoveAmount: () => void;
  onRemoveSearch: () => void;
  defaultFilterState?: IFilterState;
}

export function generateFilterBadges({
  filterState,
  tags = [],
  onRemoveDate,
  onRemoveTag,
  onRemoveAmount,
  onRemoveSearch,
  defaultFilterState = DEFAULT_FILTER_STATE,
}: IGenerateBadgesOptions): IFilterBadge[] {
  const badges: IFilterBadge[] = [];

  // Date badge
  if (filterState.dateFilter.type !== defaultFilterState.dateFilter.type) {
    let dateLabel = "";
    if (filterState.dateFilter.type === "allTime") {
      dateLabel = "All Time";
    } else if (filterState.dateFilter.type === "thisMonth") {
      dateLabel = formatMonthYear(new Date());
    } else if (filterState.dateFilter.type === "lastMonth") {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      dateLabel = formatMonthYear(lastMonth);
    } else if (
      filterState.dateFilter.type === "custom" &&
      filterState.dateFilter.from &&
      filterState.dateFilter.to
    ) {
      dateLabel = formatDateRange(
        filterState.dateFilter.from,
        filterState.dateFilter.to
      );
    }

    if (dateLabel) {
      badges.push({
        id: "date",
        type: "date",
        label: dateLabel,
        value: dateLabel,
        onRemove: onRemoveDate,
      });
    }
  }

  // Tag badges (one per selected tag)
  filterState.tagFilter.forEach((tagId) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      badges.push({
        id: `tag-${tagId}`,
        type: "tag",
        label: tag.name,
        value: tag.name,
        color: tag.color ?? undefined,
        onRemove: () => onRemoveTag(tagId),
      });
    }
  });

  // Amount badge
  const hasMin = filterState.priceFilter.min !== undefined;
  const hasMax = filterState.priceFilter.max !== undefined;
  const isDefault =
    filterState.priceFilter.min === defaultFilterState.priceFilter.min &&
    filterState.priceFilter.max === defaultFilterState.priceFilter.max;

  if (!isDefault && (hasMin || hasMax)) {
    let amountLabel = "";
    if (hasMin && hasMax) {
      amountLabel = `€${filterState.priceFilter.min}–€${filterState.priceFilter.max}`;
    } else if (hasMin) {
      amountLabel = `> €${filterState.priceFilter.min}`;
    } else if (hasMax) {
      amountLabel = `< €${filterState.priceFilter.max}`;
    }

    if (amountLabel) {
      badges.push({
        id: "amount",
        type: "amount",
        label: amountLabel,
        value: amountLabel,
        onRemove: onRemoveAmount,
      });
    }
  }

  // Search badge (optional - only show if search query exists)
  if (filterState.searchQuery.trim()) {
    badges.push({
      id: "search",
      type: "search",
      label: `Search: ${filterState.searchQuery}`,
      value: filterState.searchQuery,
      onRemove: onRemoveSearch,
    });
  }

  return badges;
}
