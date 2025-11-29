"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import React from "react";
import {
  TableSortProvider,
  useTableSortContext,
} from "./context/table-sort-context";
import { SortConfig } from "./hooks/use-table-sort";
import { TableBody } from "./table-body";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";

export type ITableProps<T = unknown> = {
  headerCells: React.ReactNode[];
  data?: T[];
  defaultSort?: SortConfig<T>;
  children?: React.ReactNode | ((sortedData: T[]) => React.ReactNode);
} & IPropsWithClassName;

function TableContent<T>({
  className,
  children,
  headerCells,
}: Omit<ITableProps<T>, "data">) {
  const sortContext = useTableSortContext<T>();

  // If children is a function and we have a sort context, call it with sortedData
  // Otherwise render children as-is (for backwards compatibility)
  const renderedChildren: React.ReactNode =
    typeof children === "function" && sortContext
      ? children(sortContext.sortedData as T[])
      : typeof children === "function"
        ? null // Function children without context - shouldn't happen, but handle gracefully
        : children;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className={cn("w-full text-sm", className)}>
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
    </div>
  );
}

export function Table<T = unknown>({
  className,
  children,
  headerCells,
  data,
  defaultSort,
}: ITableProps<T>) {
  // If data is provided, wrap in TableSortProvider
  if (data !== undefined) {
    return (
      <TableSortProvider data={data} defaultSort={defaultSort}>
        <TableContent className={className} headerCells={headerCells}>
          {children}
        </TableContent>
      </TableSortProvider>
    );
  }

  // Otherwise, render without sorting context (backwards compatibility)
  return (
    <TableContent className={className} headerCells={headerCells}>
      {children}
    </TableContent>
  );
}
