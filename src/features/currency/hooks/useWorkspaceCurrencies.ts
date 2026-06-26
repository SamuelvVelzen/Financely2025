import { getWorkspaceCurrencies } from "@/features/currency/api/client";
import { useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

export function useWorkspaceCurrencies(workspaceId: IWorkspaceId | null) {
  return useFinQuery({
    queryKey: queryKeys.workspaceCurrencies(workspaceId ?? 0),
    queryFn: () => getWorkspaceCurrencies(workspaceId!),
    enabled: workspaceId !== null,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.currencies,
  });
}
