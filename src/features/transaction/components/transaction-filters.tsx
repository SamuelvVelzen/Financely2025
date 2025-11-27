"use client";

import { useOrderedData } from "@/features/shared/hooks/use-ordered-data";
import { useTags } from "@/features/tag/hooks/useTags";
import {
  Datepicker,
  type IDateFilter,
} from "@/features/ui/datepicker/datepicker";
import { Form } from "@/features/ui/form/form";
import { RangeInput, type IPriceRange } from "@/features/ui/input/range-input";
import { SearchInput } from "@/features/ui/input/search-input";
import { SelectDropdown } from "@/features/ui/select-dropdown/select-dropdown";
import { cn } from "@/util/cn";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

type FilterFormData = {
  searchQuery: string;
  tagFilter: string[];
};

export type ITransactionFilterValues = {
  dateFilter: IDateFilter;
  priceFilter: IPriceRange;
  searchQuery: string;
  tagFilter: string[];
};

type ITransactionFiltersProps = {
  className?: string;
  onFiltersChange: (filters: ITransactionFilterValues) => void;
};

export const defaultDateFilter: IDateFilter = {
  type: "thisMonth",
  from: undefined,
  to: undefined,
};

export const defaultPriceFilter: IPriceRange = {
  min: undefined,
  max: undefined,
};

export function TransactionFilters({
  className,
  onFiltersChange,
}: ITransactionFiltersProps) {
  const [dateFilter, setDateFilter] = useState<IDateFilter>(defaultDateFilter);
  const [priceFilter, setPriceFilter] =
    useState<IPriceRange>(defaultPriceFilter);

  const filterForm = useForm<FilterFormData>({
    defaultValues: {
      searchQuery: "",
      tagFilter: [],
    },
  });

  const searchQuery = filterForm.watch("searchQuery") ?? "";
  const emptyTagFilterRef = useRef<string[]>([]);
  const tagFilter = filterForm.watch("tagFilter") ?? emptyTagFilterRef.current;

  const { data: tagsData } = useTags();
  const tags = tagsData?.data ?? [];
  const orderedTags = useOrderedData(tags);

  const tagOptions = useMemo(() => {
    return orderedTags.map((tag) => ({
      value: tag.id,
      label: tag.name,
      data: tag,
    }));
  }, [orderedTags]);

  useEffect(() => {
    onFiltersChange({
      dateFilter,
      priceFilter,
      searchQuery,
      tagFilter,
    });
  }, [dateFilter, onFiltersChange, priceFilter, searchQuery, tagFilter]);

  return (
    <div
      className={cn(
        "flex gap-3 items-end pb-4 pt-2 px-2 overflow-x-auto",
        className
      )}
    >
      <Form form={filterForm} onSubmit={() => {}}>
        <div className="flex gap-3 items-end">
          <SearchInput name="searchQuery" />

          <Datepicker value={dateFilter} onChange={setDateFilter} />

          <RangeInput
            value={priceFilter}
            onChange={setPriceFilter}
            className="w-[400px]"
          />

          <SelectDropdown
            name="tagFilter"
            options={tagOptions}
            multiple
            placeholder="Filter by tags"
            children={(option) => (
              <>
                {option.data?.color && (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: option.data.color }}
                  />
                )}
                <span className="flex-1">{option.label}</span>
              </>
            )}
          />
        </div>
      </Form>
    </div>
  );
}
