import { useBulkSelection } from "@/features/shared/hooks/use-bulk-selection";

export function useTransactionBulkSelection(visibleTransactionIds: string[]) {
  const bulk = useBulkSelection(visibleTransactionIds);

  return {
    ...bulk,
    selectedIds: bulk.selectedKeys,
    selectedIdList: bulk.selectedKeyList,
  };
}