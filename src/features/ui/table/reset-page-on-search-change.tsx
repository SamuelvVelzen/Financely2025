import { useEffect } from "react";
import {
  useTableSearchContext,
} from "./context/table-search-context";
import {
  useTablePaginationContext,
} from "./pagination/table-pagination-context";

export function ResetPageOnSearchChange() {
  const searchContext = useTableSearchContext();
  const paginationContext = useTablePaginationContext();
  const goToPage = paginationContext?.goToPage;
  const debouncedQuery = searchContext?.debouncedQuery;

  useEffect(() => {
    if (!goToPage) {
      return;
    }

    goToPage(1);
  }, [debouncedQuery, goToPage]);

  return null;
}
