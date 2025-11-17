"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";
import { HeaderCell } from "./header-cell";
import { TableBody } from "./table-body";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";

export type ITableProps = {
  headerCells: React.ReactNode[];
} & IPropsWithClassName &
  PropsWithChildren;

export function Table({ className, children, headerCells }: ITableProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className={cn("w-full text-sm", className)}>
          <TableHeader>
            <TableRow>
              {headerCells.map((cell, index) => (
                <HeaderCell key={index}>{cell}</HeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </table>
      </div>
    </div>
  );
}
