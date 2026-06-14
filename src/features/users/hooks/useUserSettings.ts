import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  IUpdateUserSettingInput,
  IUserSetting,
} from "@/features/shared/validation/schemas";
import { getMySettings, updateMySettings } from "@/features/users/api/client";

export function useUserSettings() {
  return useFinQuery<IUserSetting | null, Error>({
    queryKey: queryKeys.mySettings(),
    queryFn: getMySettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateUserSettings() {
  return useFinMutation<IUserSetting, Error, IUpdateUserSettingInput>({
    mutationFn: updateMySettings,
    invalidateQueries: [queryKeys.mySettings],
  });
}
