import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  IUpdateUserSettingInput,
  IUserSetting,
} from "@/features/shared/validation/schemas";
import { getMySettings, updateMySettings } from "@/features/users/api/client";
import { useQueryClient } from "@tanstack/react-query";

export function useUserSettings() {
  return useFinQuery<IUserSetting | null, Error>({
    queryKey: queryKeys.mySettings(),
    queryFn: getMySettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  const key = queryKeys.mySettings();
  return useFinMutation<IUserSetting, Error, IUpdateUserSettingInput>({
    mutationFn: updateMySettings,
    invalidateQueries: [queryKeys.mySettings],
    onMutate: async (input) => {
      const snapshot = queryClient.getQueryData<IUserSetting | null>(key);
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
      title: "Settings saved",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}
