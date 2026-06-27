import { cn } from "@/features/util/cn";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useMemo } from "react";
import {
  useTablePaginationContext,
} from "./pagination/table-pagination-context";
import {
  useTableSortContext,
} from "./context/table-sort-context";
import { Pagination } from "./pagination/pagination";
import { TableBody } from "./table-body";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";
import type { ITableProps } from "./table";

export function TableContent<T>({
  className,
  children,
  headerCells,
}: Omit<ITableProps<T>, "data">) {
  const sortContext = useTableSortContext<T>();
  const paginationContext = useTablePaginationContext();

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

  const renderedChildren: React.ReactNode =
    typeof children === "function" && dataToRender !== null
      ? children(dataToRender)
      : typeof children === "function"
        ? null
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
                if (React.isValidElement(cell)) {
                  return React.cloneElement(cell, { key: cell.key || index });
                }
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
