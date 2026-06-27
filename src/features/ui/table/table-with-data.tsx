import {
  useTableSearchFilteredData,
} from "./context/table-search-context";
import { TableSortProvider } from "./context/table-sort-provider";
import { type SortConfig } from "./hooks/use-table-sort";
import { TableContent } from "./table-content";
import type { ITableProps } from "./table";
import { TableWithPagination } from "./table-with-pagination";

export function TableWithData<T, TSearchContext = unknown>({
  className,
  children,
  headerCells,
  data,
  defaultSort,
  enablePagination,
  pageSize,
  initialPage,
}: Required<Pick<ITableProps<T, TSearchContext>, "data">> &
  Omit<ITableProps<T, TSearchContext>, "data" | "search">) {
  const filteredData = useTableSearchFilteredData<T>();
  const dataForSort = filteredData ?? data;

  const tableContent = enablePagination ? (
    <TableWithPagination
      className={className}
      headerCells={headerCells}
      pageSize={pageSize ?? 20}
      initialPage={initialPage ?? 1}>
      {children}
    </TableWithPagination>
  ) : (
    <TableContent
      className={className}
      headerCells={headerCells}>
      {children}
    </TableContent>
  );

  return (
    <TableSortProvider
      data={dataForSort}
      defaultSort={defaultSort}>
      {tableContent}
    </TableSortProvider>
  );
}
