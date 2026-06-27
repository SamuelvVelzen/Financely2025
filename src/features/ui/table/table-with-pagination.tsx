import { TablePaginationProvider } from "./pagination/table-pagination-provider";
import {
  useTableSortContext,
} from "./context/table-sort-context";
import { ResetPageOnSearchChange } from "./reset-page-on-search-change";
import { TableContent } from "./table-content";

type ITableWithPaginationProps<T> = {
  className?: string;
  children: React.ReactNode | ((sortedData: T[]) => React.ReactNode);
  headerCells: React.ReactNode[];
  pageSize: number;
  initialPage: number;
};

export function TableWithPagination<T>({
  className,
  children,
  headerCells,
  pageSize,
  initialPage,
}: ITableWithPaginationProps<T>) {
  const sortContext = useTableSortContext<T>();
  const sortedDataLength = sortContext?.sortedData.length ?? 0;

  return (
    <TablePaginationProvider
      totalItems={sortedDataLength}
      pageSize={pageSize}
      initialPage={initialPage}>
      <ResetPageOnSearchChange />
      <TableContent
        className={className}
        headerCells={headerCells}>
        {children}
      </TableContent>
    </TablePaginationProvider>
  );
}
