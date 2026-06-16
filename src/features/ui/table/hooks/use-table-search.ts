import { useDebouncedValue } from "@/features/util/use-debounced-value";
import { useMemo, useState } from "react";

export type TableSearchMatchArgs<T, TContext = unknown> = {
  item: T;
  query: string;
  context?: TContext;
};

export type TableSearchMatchFn<T, TContext = unknown> = (
  args: TableSearchMatchArgs<T, TContext>
) => boolean;

export type TableSearchConfig<T, TContext = unknown> = {
  placeholder?: string;
  debounceMs?: number;
  match: TableSearchMatchFn<T, TContext>;
  context?: TContext;
};

export type UseTableSearchOptions<T, TContext = unknown> = {
  data: T[];
  match: TableSearchMatchFn<T, TContext>;
  context?: TContext;
  debounceMs?: number;
};

export function useTableSearch<T, TContext = unknown>({
  data,
  match,
  context,
  debounceMs = 300,
}: UseTableSearchOptions<T, TContext>) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  const filteredData = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return data;
    }

    return data.filter((item) =>
      match({ item, query: normalizedQuery, context })
    );
  }, [data, debouncedQuery, match, context]);

  return {
    query,
    setQuery,
    debouncedQuery,
    filteredData,
    totalCount: data.length,
    filteredCount: filteredData.length,
    isSearching: debouncedQuery.trim().length > 0,
  };
}
