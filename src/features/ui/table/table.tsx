import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useMemo } from "react";
import {
  TableSortProvider,
  useTableSortContext,
} from "./context/table-sort-context";
import { SortConfig } from "./hooks/use-table-sort";
import { Pagination } from "./pagination/pagination";
import {
  TablePaginationProvider,
  useTablePaginationContext,
} from "./pagination/table-pagination-context";
import { TableBody } from "./table-body";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";

export type IBaseCellProps = {
  sticky?: boolean;
  hidden?: boolean;
  size?: "sm" | "md" | "lg";
};

export type ITableProps<T = unknown> = {
  headerCells: React.ReactNode[];
  data?: T[];
  defaultSort?: SortConfig<T>;
  enablePagination?: boolean;
  pageSize?: number;
  initialPage?: number;
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
      <TableContent
        className={className}
        headerCells={headerCells}>
        {children}
      </TableContent>
    </TablePaginationProvider>
  );
}

export function Table<T = unknown>({
  className,
  children,
  headerCells,
  data,
  defaultSort,
  enablePagination = false,
  pageSize = 20,
  initialPage = 1,
}: ITableProps<T>) {
  // If data is provided, wrap in providers
  if (data !== undefined) {
    // If pagination is enabled, wrap with both sort and pagination providers
    if (enablePagination) {
      return (
        <TableSortProvider
          data={data}
          defaultSort={defaultSort}>
          <TableWithPagination
            className={className}
            headerCells={headerCells}
            pageSize={pageSize}
            initialPage={initialPage}>
            {children}
          </TableWithPagination>
        </TableSortProvider>
      );
    }

    // Otherwise, just wrap with sort provider
    return (
      <TableSortProvider
        data={data}
        defaultSort={defaultSort}>
        <TableContent
          className={className}
          headerCells={headerCells}>
          {children}
        </TableContent>
      </TableSortProvider>
    );
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
