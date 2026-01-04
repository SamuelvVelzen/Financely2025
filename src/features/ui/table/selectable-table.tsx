import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useMemo } from "react";
import { BodyCell } from "./body-cell";
import { HeaderCell } from "./header-cell";
import { ITableProps, Table } from "./table";

export type ISelectableTableProps<T = unknown> = {
  selectedRows: Set<number>;
  onSelectionChange: (selectedRows: Set<number>) => void;
  rowCount: number;
  getRowIndex: (row: React.ReactElement) => number;
  headerCells: ITableProps<T>["headerCells"];
  data?: T[];
} & React.PropsWithChildren &
  IPropsWithClassName;

export function SelectableTable<T = unknown>({
  selectedRows,
  onSelectionChange,
  rowCount,
  getRowIndex,
  className,
  children,
  headerCells,
  data,
}: ISelectableTableProps<T>) {
  // Check if all visible rows are selected (not just compare sizes, since
  // selectedRows might contain rows from other pages)
  const allSelected = useMemo(() => {
    if (rowCount === 0) return false;

    // Collect all visible row indices
    const visibleIndices = new Set<number>();
    React.Children.forEach(children, (row) => {
      if (React.isValidElement(row)) {
        const rowIndex = getRowIndex(row);
        if (rowIndex !== undefined && rowIndex >= 0) {
          visibleIndices.add(rowIndex);
        }
      }
    });

    // Check if all visible row indices are in selectedRows
    return (
      visibleIndices.size > 0 &&
      Array.from(visibleIndices).every((index) => selectedRows.has(index))
    );
  }, [children, selectedRows, getRowIndex, rowCount]);

  const someSelected = useMemo(() => {
    if (rowCount === 0) return false;

    // Collect all visible row indices
    const visibleIndices = new Set<number>();
    React.Children.forEach(children, (row) => {
      if (React.isValidElement(row)) {
        const rowIndex = getRowIndex(row);
        if (rowIndex !== undefined && rowIndex >= 0) {
          visibleIndices.add(rowIndex);
        }
      }
    });

    // Check if some (but not all) visible rows are selected
    const selectedVisibleCount = Array.from(visibleIndices).filter((index) =>
      selectedRows.has(index)
    ).length;

    return (
      selectedVisibleCount > 0 && selectedVisibleCount < visibleIndices.size
    );
  }, [children, selectedRows, getRowIndex, rowCount]);

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all - collect all row indices from children
      const allIndices = new Set<number>();
      React.Children.forEach(children, (row) => {
        if (React.isValidElement(row)) {
          const rowIndex = getRowIndex(row);
          if (rowIndex !== undefined && rowIndex >= 0) {
            allIndices.add(rowIndex);
          }
        }
      });
      onSelectionChange(allIndices);
    }
  };

  const handleRowToggle = (rowIndex: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    onSelectionChange(newSelection);
  };

  // Add checkbox to each row (children are TableRow components directly)
  const rowsWithCheckboxes = React.Children.map(children, (row) => {
    if (!React.isValidElement(row)) {
      return row;
    }

    const rowIndex = getRowIndex(row);
    if (rowIndex === undefined || rowIndex < 0) {
      return row;
    }

    const rowProps = row.props as { children?: React.ReactNode };
    const rowChildren = React.Children.toArray(rowProps.children);
    const isSelected = selectedRows.has(rowIndex);
    const checkboxCell = (
      <BodyCell key="row-checkbox">
        <Checkbox
          checked={isSelected}
          onChange={() => handleRowToggle(rowIndex)}
        />
      </BodyCell>
    );

    return React.cloneElement(
      row as React.ReactElement<any>,
      {
        key: row.key || rowIndex,
      },
      [checkboxCell, ...rowChildren]
    );
  });

  // Add checkbox to header (prepend to headerCells)
  // Preserve HeaderCell components as-is, they'll be handled by Table component
  const headerCellsWithCheckbox = [
    <HeaderCell
      key="select-all-checkbox"
      sortable={false}>
      <Checkbox
        checked={allSelected}
        indeterminate={someSelected}
        onChange={handleSelectAll}
      />
    </HeaderCell>,
    ...headerCells,
  ];

  return (
    <Table
      className={className}
      headerCells={headerCellsWithCheckbox}
      data={data}>
      {rowsWithCheckboxes}
    </Table>
  );
}
