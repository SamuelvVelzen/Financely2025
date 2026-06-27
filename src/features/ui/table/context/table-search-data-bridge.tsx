import {
  TableSearchDataContext,
} from "./table-search-context";

export function TableSearchDataBridge<T>({
  filteredData,
  children,
}: {
  filteredData: T[];
  children: React.ReactNode;
}) {
  return (
    <TableSearchDataContext.Provider value={filteredData}>
      {children}
    </TableSearchDataContext.Provider>
  );
}
