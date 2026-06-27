import type { ICurrency } from "@/features/currency/config/currencies";
import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  IUpdateWorkspaceSettingInput,
  IWorkspaceSetting,
} from "@/features/shared/validation/schemas";
import {
  getWorkspaceSettings,
  updateWorkspaceSettings,
} from "@/features/users/api/client";
import { getBrowserCurrency } from "@/features/users/utils/browser-defaults";
import { resolveDefaultCurrencyFromSetting } from "@/features/workspace/utils/resolve-default-currency";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export function useWorkspaceSettings(workspaceId: IWorkspaceId | null) {
  return useFinQuery<IWorkspaceSetting | null, Error>({
    queryKey: queryKeys.workspaceSettings(workspaceId ?? 0),
    queryFn: () => getWorkspaceSettings(workspaceId!),
    enabled: workspaceId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateWorkspaceSettings(workspaceId: IWorkspaceId | null) {
  const queryClient = useQueryClient();
  return useFinMutation<
    IWorkspaceSetting,
    Error,
    IUpdateWorkspaceSettingInput
  >({
    mutationFn: (data) => updateWorkspaceSettings(workspaceId!, data),
    invalidateQueries: workspaceId
      ? [() => queryKeys.workspaceSettings(workspaceId)]
      : [],
    onMutate: async (input) => {
      if (workspaceId == null) return undefined;
      const key = queryKeys.workspaceSettings(workspaceId);
      const snapshot = queryClient.getQueryData<IWorkspaceSetting | null>(key);
      if (snapshot) {
        queryClient.setQueryData(key, {
          ...snapshot,
          ...input,
          updatedAt: new Date().toISOString(),
        });
      }
      return { snapshot: [[key, snapshot]] as const };
    },
    getOfflineQueuedToast: () => ({
      title: "Workspace settings saved",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

export function useDefaultCurrency(
  workspaceId: IWorkspaceId | null,
): ICurrency {
  const { data: settings } = useWorkspaceSettings(workspaceId);

  return useMemo(() => {
    if (settings) {
      return resolveDefaultCurrencyFromSetting(settings);
    }
    return getBrowserCurrency();
  }, [settings]);
}
