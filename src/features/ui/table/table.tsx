import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import React from "react";
import { TableSearchProvider } from "./context/table-search-provider";
import { type SortConfig } from "./hooks/use-table-sort";
import { type TableSearchConfig } from "./hooks/use-table-search";
import { TableContent } from "./table-content";
import { TableSearchBar } from "./table-search-bar";
import { TableWithData } from "./table-with-data";

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

  return (
    <TableContent
      className={className}
      headerCells={headerCells}>
      {children}
    </TableContent>
  );
}
