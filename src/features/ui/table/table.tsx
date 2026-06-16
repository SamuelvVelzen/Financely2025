import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useEffect, useMemo } from "react";
import {
  TableSearchProvider,
  useTableSearchContext,
  useTableSearchFilteredData,
} from "./context/table-search-context";
import {
  TableSortProvider,
  useTableSortContext,
} from "./context/table-sort-context";
import { SortConfig } from "./hooks/use-table-sort";
import { TableSearchConfig } from "./hooks/use-table-search";
import { Pagination } from "./pagination/pagination";
import {
  TablePaginationProvider,
  useTablePaginationContext,
} from "./pagination/table-pagination-context";
import { TableBody } from "./table-body";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";
import { TableSearchBar } from "./table-search-bar";

export type IBaseCellProps = {
  sticky?: boolean;
  hidden?: boolean;
  size?: "sm" | "md" | "lg";
};

export type ITableProps<T = unknown, TSearchContext = unknown> = {
  headerCells: React.ReactNode[];
  data?: T[];
  defaultSort?: SortConfig<T>;
  enablePagination?: boolean;
  pageSize?: number;
  initialPage?: number;
  search?: TableSearchConfig<T, TSearchContext>;
  children?: React.ReactNode | ((sortedData: T[]) => React.ReactNode);
} & IPropsWithClassName;

function TableContent<T>({
  className,
  children,
  headerCells,
}: Omit<ITableProps<T>, "data">) {
  const sortContext = useTableSortContext<T>();
  const paginationContext = useTablePaginationContext();

  // If pagination is enabled, paginate the sorted data
  // Otherwise, use sorted data directly
  const dataToRender = useMemo(() => {
    if (!sortContext) {
      return null;
    }

    const sortedData = sortContext.sortedData as T[];
    if (paginationContext) {
      return paginationContext.paginate(sortedData);
    }
    return sortedData;
  }, [sortContext, paginationContext]);

  // If children is a function and we have data, call it with the data
  // Otherwise render children as-is (for backwards compatibility)
  const renderedChildren: React.ReactNode =
    typeof children === "function" && dataToRender !== null
      ? children(dataToRender)
      : typeof children === "function"
        ? null // Function children without context - shouldn't happen, but handle gracefully
        : children;

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full text-sm border-separate border-spacing-0",
            className
          )}>
          <TableHeader>
            <TableRow>
              {headerCells.map((cell, index) => {
                // If it's already a React element, render it directly
                if (React.isValidElement(cell)) {
                  return React.cloneElement(cell, { key: cell.key || index });
                }
                // Otherwise treat it as a component type (for backwards compatibility)
                const Cell = cell as unknown as React.ComponentType;
                return <Cell key={index} />;
              })}
            </TableRow>
          </TableHeader>
          <TableBody>{renderedChildren}</TableBody>
        </table>
      </div>
      {paginationContext && (
        <div className="p-4 border-t border-border">
          <Pagination
            currentPage={paginationContext.currentPage}
            totalPages={paginationContext.totalPages}
            onPageChange={paginationContext.goToPage}
          />
        </div>
      )}
    </div>
  );
}

function ResetPageOnSearchChange() {
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

// Wrapper component that provides pagination based on sorted data length
function TableWithPagination<T>({
  className,
  children,
  headerCells,
  pageSize,
  initialPage,
}: {
  className?: string;
  children: React.ReactNode | ((sortedData: T[]) => React.ReactNode);
  headerCells: React.ReactNode[];
  pageSize: number;
  initialPage: number;
}) {
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

function TableWithData<T, TSearchContext = unknown>({
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

export function Table<T = unknown, TSearchContext = unknown>({
  className,
  children,
  headerCells,
  data,
  defaultSort,
  enablePagination = false,
  pageSize = 20,
  initialPage = 1,
  search,
}: ITableProps<T, TSearchContext>) {
  // If data is provided, wrap in providers
  if (data !== undefined) {
    const table = (
      <TableWithData
        className={className}
        headerCells={headerCells}
        data={data}
        defaultSort={defaultSort}
        enablePagination={enablePagination}
        pageSize={pageSize}
        initialPage={initialPage}>
        {children}
      </TableWithData>
    );

    if (search) {
      return (
        <div className="space-y-3">
          <TableSearchProvider
            data={data}
            search={search}>
            <TableSearchBar placeholder={search.placeholder} />
            {table}
          </TableSearchProvider>
        </div>
      );
    }

    return table;
  }

  // Otherwise, render without sorting/pagination context (backwards compatibility)
  return (
    <TableContent
      className={className}
      headerCells={headerCells}>
      {children}
    </TableContent>
  );
}
