import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useMemo, useRef, useState } from "react";
import { Alert } from "../alert/alert";
import { LinkButton } from "../button/link-button";
import { BodyCell } from "./body-cell";
import { HeaderCell } from "./header-cell";
import { ITableProps, Table } from "./table";

export type ISelectableTableProps<T = unknown> = {
  selectedRows: Set<number>;
  onSelectionChange: (selectedRows: Set<number>) => void;
  rowCount?: number;
  getRowIndex: ((row: React.ReactElement) => number) | ((item: T) => number);
  headerCells: ITableProps<T>["headerCells"];
  data?: T[];
  enablePagination?: boolean;
  pageSize?: number;
  initialPage?: number;
  children?: React.ReactNode | ((paginatedData: T[]) => React.ReactNode);
  // Gmail-style alert props
  onSelectAllValid?: () => void;
  getItemValidity?: (item: T) => boolean;
  selectAllAlertText?: (
    visibleCount: number,
    totalCount: number
  ) => React.ReactNode;
  selectAllAlertButtonText?: string;
  showSelectAllAlert?: boolean;
} & IPropsWithClassName;

export function SelectableTable<T = unknown>({
  selectedRows,
  onSelectionChange,
  rowCount,
  getRowIndex,
  className,
  children,
  headerCells,
  data,
  enablePagination,
  pageSize,
  initialPage,
  onSelectAllValid,
  getItemValidity,
  selectAllAlertText,
  selectAllAlertButtonText = "Select all valid",
  showSelectAllAlert = true,
}: ISelectableTableProps<T>) {
  // If data is provided and children is a function, use function children pattern
  // Otherwise, use the existing pattern with pre-rendered children
  const isFunctionChildren =
    typeof children === "function" && data !== undefined;

  // For function children, we need to compute selection state from the paginated data
  // For pre-rendered children, we compute from the children elements
  const allSelected = useMemo(() => {
    if (isFunctionChildren && data) {
      // This will be computed inside the function children based on paginated data
      return false; // Will be computed per page
    }

    if (!rowCount || rowCount === 0) return false;

    // Collect all visible row indices from pre-rendered children
    const visibleIndices = new Set<number>();
    if (typeof children !== "function") {
      React.Children.forEach(children, (row) => {
        if (React.isValidElement(row)) {
          // For pre-rendered children, getRowIndex takes a ReactElement
          const rowIndex = (getRowIndex as (row: React.ReactElement) => number)(
            row
          );
          if (typeof rowIndex === "number" && rowIndex >= 0) {
            visibleIndices.add(rowIndex);
          }
        }
      });
    }

    // Check if all visible row indices are in selectedRows
    return (
      visibleIndices.size > 0 &&
      Array.from(visibleIndices).every((index) => selectedRows.has(index))
    );
  }, [isFunctionChildren, data, children, selectedRows, getRowIndex, rowCount]);

  const someSelected = useMemo(() => {
    if (isFunctionChildren && data) {
      // This will be computed inside the function children based on paginated data
      return false; // Will be computed per page
    }

    if (!rowCount || rowCount === 0) return false;

    // Collect all visible row indices from pre-rendered children
    const visibleIndices = new Set<number>();
    if (typeof children !== "function") {
      React.Children.forEach(children, (row) => {
        if (React.isValidElement(row)) {
          // For pre-rendered children, getRowIndex takes a ReactElement
          const rowIndex = (getRowIndex as (row: React.ReactElement) => number)(
            row
          );
          if (typeof rowIndex === "number" && rowIndex >= 0) {
            visibleIndices.add(rowIndex);
          }
        }
      });
    }

    // Check if some (but not all) visible rows are selected
    const selectedVisibleCount = Array.from(visibleIndices).filter((index) =>
      selectedRows.has(index)
    ).length;

    return (
      selectedVisibleCount > 0 && selectedVisibleCount < visibleIndices.size
    );
  }, [isFunctionChildren, data, children, selectedRows, getRowIndex, rowCount]);

  const handleSelectAll = (paginatedData?: T[]) => {
    if (allSelected) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all - collect all row indices
      const allIndices = new Set<number>();
      if (paginatedData && typeof getRowIndex === "function") {
        // Function children pattern: use paginated data
        paginatedData.forEach((item) => {
          const rowIndex = (getRowIndex as (item: T) => number)(item);
          if (typeof rowIndex === "number" && rowIndex >= 0) {
            allIndices.add(rowIndex);
          }
        });
      } else if (typeof children !== "function") {
        // Pre-rendered children pattern
        React.Children.forEach(children, (row) => {
          if (React.isValidElement(row)) {
            // For pre-rendered children, getRowIndex takes a ReactElement
            const rowIndex = (
              getRowIndex as (row: React.ReactElement) => number
            )(row);
            if (typeof rowIndex === "number" && rowIndex >= 0) {
              allIndices.add(rowIndex);
            }
          }
        });
      }
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

  const handleRowClick = (
    rowIndex: number,
    e: React.MouseEvent<HTMLTableRowElement>
  ) => {
    handleRowToggle(rowIndex);
  };

  // Add checkbox to header (prepend to headerCells)
  const headerCellsWithCheckbox = [
    <HeaderCell
      key="select-all-checkbox"
      sortable={false}
      sticky={true}>
      <Checkbox
        checked={allSelected}
        indeterminate={someSelected}
        onChange={(e) => {
          e.stopPropagation();
          handleSelectAll();
        }}
      />
    </HeaderCell>,
    ...headerCells,
  ];

  // If using function children pattern, wrap the function to add checkboxes
  if (isFunctionChildren && typeof children === "function") {
    // Use both ref and state to track current page data
    // Ref for immediate access in callbacks, state for triggering re-renders
    const currentPageDataRef = useRef<T[]>([]);
    const [currentPageData, setCurrentPageData] = useState<T[]>([]);

    // Compute header checkbox state from current page data
    const pageAllSelected = useMemo(() => {
      if (currentPageData.length === 0) return false;
      return currentPageData.every((item) => {
        const rowIndex = (getRowIndex as (item: T) => number)(item);
        return selectedRows.has(rowIndex);
      });
    }, [currentPageData, selectedRows, getRowIndex]);

    const pageSomeSelected = useMemo(() => {
      if (currentPageData.length === 0) return false;
      const selectedCount = currentPageData.filter((item) => {
        const rowIndex = (getRowIndex as (item: T) => number)(item);
        return selectedRows.has(rowIndex);
      }).length;
      return selectedCount > 0 && selectedCount < currentPageData.length;
    }, [currentPageData, selectedRows, getRowIndex]);

    // Calculate if all visible rows are selected (for Gmail-style alert)
    const allVisibleRowsSelected = useMemo(() => {
      if (currentPageData.length === 0) return false;
      return currentPageData.every((item) => {
        const rowIndex = (getRowIndex as (item: T) => number)(item);
        return selectedRows.has(rowIndex);
      });
    }, [currentPageData, selectedRows, getRowIndex]);

    // Calculate total valid items (if getItemValidity is provided)
    const totalValidItems = useMemo(() => {
      if (!getItemValidity || !data) return 0;
      return data.filter(getItemValidity).length;
    }, [data, getItemValidity]);

    // Calculate selected valid count
    const selectedValidCount = useMemo(() => {
      if (!getItemValidity || !data) return 0;
      return data.filter(
        (item) =>
          getItemValidity(item) &&
          selectedRows.has((getRowIndex as (item: T) => number)(item))
      ).length;
    }, [data, getItemValidity, selectedRows, getRowIndex]);

    // Determine if alert should be shown
    const shouldShowAlert =
      showSelectAllAlert &&
      onSelectAllValid &&
      getItemValidity &&
      allVisibleRowsSelected &&
      selectedValidCount < totalValidItems &&
      totalValidItems > currentPageData.length &&
      enablePagination;

    // Default alert text
    const defaultAlertText = (visibleCount: number, totalCount: number) => (
      <>
        All {visibleCount} visible items selected. Select all {totalCount} valid
        items?
      </>
    );

    const handleSelectAllPage = () => {
      if (pageAllSelected) {
        // Deselect all items on current page
        const pageIndices = currentPageDataRef.current.map((item) =>
          (getRowIndex as (item: T) => number)(item)
        );
        const newSelection = new Set(selectedRows);
        pageIndices.forEach((idx) => newSelection.delete(idx));
        onSelectionChange(newSelection);
      } else {
        // Select all items on current page
        const pageIndices = currentPageDataRef.current.map((item) =>
          (getRowIndex as (item: T) => number)(item)
        );
        const newSelection = new Set(selectedRows);
        pageIndices.forEach((idx) => newSelection.add(idx));
        onSelectionChange(newSelection);
      }
    };

    // Header cells with checkbox that reflects current page state
    const headerCellsWithPageCheckbox = [
      <HeaderCell
        key="select-all-checkbox"
        sortable={false}
        sticky={true}>
        <Checkbox
          checked={pageAllSelected}
          indeterminate={pageSomeSelected}
          onChange={(e) => {
            e.stopPropagation();
            handleSelectAllPage();
          }}
        />
      </HeaderCell>,
      ...headerCells,
    ];

    return (
      <>
        {/* Gmail-style alert */}
        {shouldShowAlert && (
          <Alert
            variant="info"
            className="mb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                {selectAllAlertText
                  ? selectAllAlertText(currentPageData.length, totalValidItems)
                  : defaultAlertText(currentPageData.length, totalValidItems)}
              </div>
              <LinkButton
                size="sm"
                clicked={onSelectAllValid}
                buttonContent={selectAllAlertButtonText}
                className="whitespace-nowrap"
              />
            </div>
          </Alert>
        )}

        <Table
          className={className}
          headerCells={headerCellsWithPageCheckbox}
          data={data}
          enablePagination={enablePagination}
          pageSize={pageSize}
          initialPage={initialPage}>
          {(paginatedData: T[]) => {
            // Update both ref and state with current page data
            currentPageDataRef.current = paginatedData;
            // Update state to trigger re-renders for alert calculation
            // Compare by length and first/last item to avoid unnecessary updates
            if (
              currentPageData.length !== paginatedData.length ||
              (paginatedData.length > 0 &&
                (currentPageData[0] !== paginatedData[0] ||
                  currentPageData[currentPageData.length - 1] !==
                    paginatedData[paginatedData.length - 1]))
            ) {
              setCurrentPageData(paginatedData);
            }

            // Render rows with checkboxes
            const rows = children(paginatedData);
            const rowsArray = React.Children.toArray(rows);

            return rowsArray.map((row, idx) => {
              if (!React.isValidElement(row)) {
                return row;
              }

              // Get row index from data item
              const item = paginatedData[idx];
              if (!item) {
                return row;
              }

              const rowIndex = (getRowIndex as (item: T) => number)(item);
              if (typeof rowIndex !== "number" || rowIndex < 0) {
                return row;
              }

              const rowProps = row.props as {
                children?: React.ReactNode;
                onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
              };
              const rowChildren = React.Children.toArray(rowProps.children);
              const isSelected = selectedRows.has(rowIndex);
              const checkboxCell = (
                <BodyCell
                  key="row-checkbox"
                  sticky={true}>
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleRowToggle(rowIndex);
                    }}
                  />
                </BodyCell>
              );

              // Combine existing onClick with row selection handler
              const existingOnClick = rowProps.onClick;
              const combinedOnClick = (
                e: React.MouseEvent<HTMLTableRowElement>
              ) => {
                if (existingOnClick) {
                  existingOnClick(e);
                }
                handleRowClick(rowIndex, e);
              };

              return React.cloneElement(
                row as React.ReactElement<any>,
                {
                  key: row.key || rowIndex,
                  onClick: combinedOnClick,
                },
                [checkboxCell, ...rowChildren]
              );
            });
          }}
        </Table>
      </>
    );
  }

  // Pre-rendered children pattern (existing behavior)
  if (typeof children === "function") {
    // This shouldn't happen if data is not provided, but handle gracefully
    return null;
  }

  const rowsWithCheckboxes = React.Children.map(children, (row) => {
    if (!React.isValidElement(row)) {
      return row;
    }

    // For pre-rendered children, getRowIndex takes a ReactElement
    const rowIndex = (getRowIndex as (row: React.ReactElement) => number)(row);
    if (typeof rowIndex !== "number" || rowIndex < 0) {
      return row;
    }

    const rowProps = row.props as {
      children?: React.ReactNode;
      onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
    };
    const rowChildren = React.Children.toArray(rowProps.children);
    const isSelected = selectedRows.has(rowIndex);
    const checkboxCell = (
      <BodyCell
        key="row-checkbox"
        sticky={true}>
        <Checkbox
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            handleRowToggle(rowIndex);
          }}
        />
      </BodyCell>
    );

    // Combine existing onClick with row selection handler
    const existingOnClick = rowProps.onClick;
    const combinedOnClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
      if (existingOnClick) {
        existingOnClick(e);
      }
      handleRowClick(rowIndex, e);
    };

    return React.cloneElement(
      row as React.ReactElement<any>,
      {
        key: row.key || rowIndex,
        onClick: combinedOnClick,
      },
      [checkboxCell, ...rowChildren]
    );
  });

  return (
    <Table
      className={className}
      headerCells={headerCellsWithCheckbox}
      data={data}
      enablePagination={enablePagination}
      pageSize={pageSize}
      initialPage={initialPage}>
      {rowsWithCheckboxes}
    </Table>
  );
}
