import { Checkbox } from "@/features/ui/checkbox/checkbox";
import { type IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useMemo, useRef, useState } from "react";
import { Alert } from "../alert/alert";
import { LinkButton } from "../button/link-button";
import { BodyCell } from "./body-cell";
import { HeaderCell } from "./header-cell";
import { type TableSearchConfig } from "./hooks/use-table-search";
import { type SortConfig } from "./hooks/use-table-sort";
import { type ITableProps, Table } from "./table";

function isValidSelectableKey<TKey extends string | number>(key: TKey): boolean {
  if (typeof key === "number") {
    return Number.isFinite(key) && key >= 0;
  }
  return key.length > 0;
}

export type ISelectableTableProps<
  T = unknown,
  TKey extends string | number = number,
> = {
  selectedKeys: Set<TKey>;
  onSelectionChange: (selectedKeys: Set<TKey>) => void;
  rowCount?: number;
  getRowKey: ((row: React.ReactElement) => TKey) | ((item: T) => TKey);
  headerCells: ITableProps<T>["headerCells"];
  data?: T[];
  enablePagination?: boolean;
  pageSize?: number;
  initialPage?: number;
  search?: TableSearchConfig<T>;
  children?: React.ReactNode | ((paginatedData: T[]) => React.ReactNode);
  onSelectAllValid?: () => void;
  getItemValidity?: (item: T) => boolean;
  selectAllAlertText?: (
    visibleCount: number,
    totalCount: number,
  ) => React.ReactNode;
  selectAllAlertButtonText?: string;
  showSelectAllAlert?: boolean;
  defaultSort?: SortConfig<T>;
  /** When false, row click does not toggle selection (checkbox only). Defaults to true. */
  selectOnRowClick?: boolean;
} & IPropsWithClassName;

export function SelectableTable<
  T = unknown,
  TKey extends string | number = number,
>({
  selectedKeys,
  onSelectionChange,
  rowCount,
  getRowKey,
  className,
  children,
  headerCells,
  data,
  enablePagination,
  pageSize,
  initialPage,
  search,
  onSelectAllValid,
  getItemValidity,
  selectAllAlertText,
  selectAllAlertButtonText = "Select all valid",
  showSelectAllAlert = true,
  defaultSort,
  selectOnRowClick = true,
}: ISelectableTableProps<T, TKey>) {
  const isFunctionChildren =
    typeof children === "function" && data !== undefined;

  const allSelected = useMemo(() => {
    if (isFunctionChildren && data) {
      return false;
    }

    if (!rowCount || rowCount === 0) {
      return false;
    }

    const visibleKeys = new Set<TKey>();
    if (typeof children !== "function") {
      React.Children.forEach(children, (row) => {
        if (React.isValidElement(row)) {
          const rowKey = (getRowKey as (row: React.ReactElement) => TKey)(row);
          if (isValidSelectableKey(rowKey)) {
            visibleKeys.add(rowKey);
          }
        }
      });
    }

    return (
      visibleKeys.size > 0 &&
      Array.from(visibleKeys).every((key) => selectedKeys.has(key))
    );
  }, [isFunctionChildren, data, children, selectedKeys, getRowKey, rowCount]);

  const someSelected = useMemo(() => {
    if (isFunctionChildren && data) {
      return false;
    }

    if (!rowCount || rowCount === 0) {
      return false;
    }

    const visibleKeys = new Set<TKey>();
    if (typeof children !== "function") {
      React.Children.forEach(children, (row) => {
        if (React.isValidElement(row)) {
          const rowKey = (getRowKey as (row: React.ReactElement) => TKey)(row);
          if (isValidSelectableKey(rowKey)) {
            visibleKeys.add(rowKey);
          }
        }
      });
    }

    const selectedVisibleCount = Array.from(visibleKeys).filter((key) =>
      selectedKeys.has(key),
    ).length;

    return selectedVisibleCount > 0 && selectedVisibleCount < visibleKeys.size;
  }, [isFunctionChildren, data, children, selectedKeys, getRowKey, rowCount]);

  const handleSelectAll = (paginatedData?: T[]) => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      const allKeys = new Set<TKey>();
      if (paginatedData && typeof getRowKey === "function") {
        paginatedData.forEach((item) => {
          const rowKey = (getRowKey as (item: T) => TKey)(item);
          if (isValidSelectableKey(rowKey)) {
            allKeys.add(rowKey);
          }
        });
      } else if (typeof children !== "function") {
        React.Children.forEach(children, (row) => {
          if (React.isValidElement(row)) {
            const rowKey = (getRowKey as (row: React.ReactElement) => TKey)(
              row,
            );
            if (isValidSelectableKey(rowKey)) {
              allKeys.add(rowKey);
            }
          }
        });
      }
      onSelectionChange(allKeys);
    }
  };

  const handleRowToggle = (rowKey: TKey) => {
    const newSelection = new Set(selectedKeys);
    if (newSelection.has(rowKey)) {
      newSelection.delete(rowKey);
    } else {
      newSelection.add(rowKey);
    }
    onSelectionChange(newSelection);
  };

  const handleRowClick = (rowKey: TKey) => {
    handleRowToggle(rowKey);
  };

  const currentPageDataRef = useRef<T[]>([]);
  const [currentPageData, setCurrentPageData] = useState<T[]>([]);

  const pageAllSelected = useMemo(() => {
    if (!isFunctionChildren || currentPageData.length === 0) {
      return false;
    }
    return currentPageData.every((item) => {
      const rowKey = (getRowKey as (item: T) => TKey)(item);
      return selectedKeys.has(rowKey);
    });
  }, [isFunctionChildren, currentPageData, selectedKeys, getRowKey]);

  const pageSomeSelected = useMemo(() => {
    if (!isFunctionChildren || currentPageData.length === 0) {
      return false;
    }
    const selectedCount = currentPageData.filter((item) => {
      const rowKey = (getRowKey as (item: T) => TKey)(item);
      return selectedKeys.has(rowKey);
    }).length;
    return selectedCount > 0 && selectedCount < currentPageData.length;
  }, [isFunctionChildren, currentPageData, selectedKeys, getRowKey]);

  const allVisibleRowsSelected = useMemo(() => {
    if (!isFunctionChildren || currentPageData.length === 0) {
      return false;
    }
    return currentPageData.every((item) => {
      const rowKey = (getRowKey as (item: T) => TKey)(item);
      return selectedKeys.has(rowKey);
    });
  }, [isFunctionChildren, currentPageData, selectedKeys, getRowKey]);

  const totalValidItems = useMemo(() => {
    if (!isFunctionChildren || !getItemValidity || !data) {
      return 0;
    }
    return data.filter(getItemValidity).length;
  }, [isFunctionChildren, data, getItemValidity]);

  const selectedValidCount = useMemo(() => {
    if (!isFunctionChildren || !getItemValidity || !data) {
      return 0;
    }
    return data.filter(
      (item) =>
        getItemValidity(item) &&
        selectedKeys.has((getRowKey as (item: T) => TKey)(item)),
    ).length;
  }, [isFunctionChildren, data, getItemValidity, selectedKeys, getRowKey]);

  const shouldShowAlert =
    isFunctionChildren &&
    showSelectAllAlert &&
    onSelectAllValid &&
    getItemValidity &&
    allVisibleRowsSelected &&
    selectedValidCount < totalValidItems &&
    totalValidItems > currentPageData.length &&
    enablePagination;

  const defaultAlertText = (visibleCount: number, totalCount: number) => (
    <>
      All {visibleCount} visible items selected. Select all {totalCount} valid
      items?
    </>
  );

  const handleSelectAllPage = () => {
    if (pageAllSelected) {
      const pageKeys = currentPageDataRef.current.map((item) =>
        (getRowKey as (item: T) => TKey)(item),
      );
      const newSelection = new Set(selectedKeys);
      pageKeys.forEach((key) => newSelection.delete(key));
      onSelectionChange(newSelection);
    } else {
      const pageKeys = currentPageDataRef.current.map((item) =>
        (getRowKey as (item: T) => TKey)(item),
      );
      const newSelection = new Set(selectedKeys);
      pageKeys.forEach((key) => newSelection.add(key));
      onSelectionChange(newSelection);
    }
  };

  const headerCellsWithPageCheckbox = [
    <HeaderCell key="select-all-checkbox" sortable={false} sticky={true}>
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

  const headerCellsWithCheckbox = [
    <HeaderCell key="select-all-checkbox" sortable={false} sticky={true}>
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

  if (isFunctionChildren && typeof children === "function") {
    return (
      <>
        {shouldShowAlert && (
          <Alert variant="info" className="mb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                {selectAllAlertText
                  ? selectAllAlertText(currentPageData.length, totalValidItems)
                  : defaultAlertText(currentPageData.length, totalValidItems)}
              </div>
              <LinkButton
                size="sm"
                variant="info"
                appearance="outlined"
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
          defaultSort={defaultSort}
          enablePagination={enablePagination}
          pageSize={pageSize}
          initialPage={initialPage}
          search={search}
        >
          {(paginatedData: T[]) => {
            currentPageDataRef.current = paginatedData;
            if (
              currentPageData.length !== paginatedData.length ||
              (paginatedData.length > 0 &&
                (currentPageData[0] !== paginatedData[0] ||
                  currentPageData[currentPageData.length - 1] !==
                    paginatedData[paginatedData.length - 1]))
            ) {
              setCurrentPageData(paginatedData);
            }

            const rows = children(paginatedData);
            const rowsArray = React.Children.toArray(rows);

            return rowsArray.map((row, idx) => {
              if (!React.isValidElement(row)) {
                return row;
              }

              const item = paginatedData[idx];
              if (!item) {
                return row;
              }

              const rowKey = (getRowKey as (item: T) => TKey)(item);
              if (!isValidSelectableKey(rowKey)) {
                return row;
              }

              const rowProps = row.props as {
                children?: React.ReactNode;
                onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
              };
              const rowChildren = React.Children.toArray(rowProps.children);
              const isRowSelected = selectedKeys.has(rowKey);
              const checkboxCell = (
                <BodyCell key="row-checkbox" sticky={true}>
                  <Checkbox
                    checked={isRowSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleRowToggle(rowKey);
                    }}
                  />
                </BodyCell>
              );

              const existingOnClick = rowProps.onClick;
              const combinedOnClick = (
                e: React.MouseEvent<HTMLTableRowElement>,
              ) => {
                if (existingOnClick) {
                  existingOnClick(e);
                }
                if (selectOnRowClick) {
                  handleRowClick(rowKey);
                }
              };

              return React.cloneElement(
                row as React.ReactElement<{
                  onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
                  children?: React.ReactNode;
                }>,
                {
                  key: row.key ?? String(rowKey),
                  onClick: combinedOnClick,
                },
                [checkboxCell, ...rowChildren],
              );
            });
          }}
        </Table>
      </>
    );
  }

  if (typeof children === "function") {
    return null;
  }

  const rowsWithCheckboxes = React.Children.map(children, (row) => {
    if (!React.isValidElement(row)) {
      return row;
    }

    const rowKey = (getRowKey as (row: React.ReactElement) => TKey)(row);
    if (!isValidSelectableKey(rowKey)) {
      return row;
    }

    const rowProps = row.props as {
      children?: React.ReactNode;
      onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
    };
    const rowChildren = React.Children.toArray(rowProps.children);
    const isRowSelected = selectedKeys.has(rowKey);
    const checkboxCell = (
      <BodyCell key="row-checkbox" sticky={true}>
        <Checkbox
          checked={isRowSelected}
          onChange={(e) => {
            e.stopPropagation();
            handleRowToggle(rowKey);
          }}
        />
      </BodyCell>
    );

    const existingOnClick = rowProps.onClick;
    const combinedOnClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
      if (existingOnClick) {
        existingOnClick(e);
      }
      if (selectOnRowClick) {
        handleRowClick(rowKey);
      }
    };

    return React.cloneElement(
      row as React.ReactElement<{
        onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
        children?: React.ReactNode;
      }>,
      {
        key: row.key ?? String(rowKey),
        onClick: combinedOnClick,
      },
      [checkboxCell, ...rowChildren],
    );
  });

  return (
    <Table
      className={className}
      headerCells={headerCellsWithCheckbox}
      data={data}
      defaultSort={defaultSort}
      enablePagination={enablePagination}
      pageSize={pageSize}
      initialPage={initialPage}
      search={search}
    >
      {rowsWithCheckboxes}
    </Table>
  );
}