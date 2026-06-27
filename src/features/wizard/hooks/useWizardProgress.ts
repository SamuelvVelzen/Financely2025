import { OFFLINE_MUTATION_DEFAULT_DETAIL } from "@/features/shared/offline/offline-mutation-errors";
import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import {
  completeWizard,
  getAllWizardProgress,
  getWizardProgress,
  updateWizardProgress,
} from "@/features/wizard/api/client";
import type { IWizardProgressResponse } from "@/features/wizard/services/wizard.service";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Query all wizard progress for the current user
 */
export function useAllWizardProgress() {
  return useFinQuery<IWizardProgressResponse[], Error>({
    queryKey: queryKeys.wizardProgress(),
    queryFn: getAllWizardProgress,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query progress for a specific wizard
 */
export function useWizardProgress(wizardId: string) {
  return useFinQuery<IWizardProgressResponse | null, Error>({
    queryKey: queryKeys.wizardProgressById(wizardId),
    queryFn: () => getWizardProgress(wizardId),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Update wizard progress mutation
 */
export function useUpdateWizardProgress() {
  const queryClient = useQueryClient();
  return useFinMutation<
    IWizardProgressResponse,
    Error,
    { wizardId: string; currentStepIndex: number; totalSteps: number }
  >({
    mutationFn: ({ wizardId, currentStepIndex, totalSteps }) =>
      updateWizardProgress(wizardId, currentStepIndex, totalSteps),
    invalidateQueries: [queryKeys.wizardProgress],
    onMutate: async ({ wizardId, currentStepIndex, totalSteps }) => {
      const listKey = queryKeys.wizardProgress();
      const itemKey = queryKeys.wizardProgressById(wizardId);
      const listSnapshot = queryClient.getQueryData<IWizardProgressResponse[]>(listKey);
      const itemSnapshot = queryClient.getQueryData<IWizardProgressResponse | null>(itemKey);
      const percentComplete = Math.round(
        (currentStepIndex / Math.max(totalSteps, 1)) * 100,
      );
      const patch = {
        currentStepIndex,
        totalSteps,
        percentComplete,
        completed: false,
        updatedAt: new Date().toISOString(),
      };
      if (listSnapshot) {
        queryClient.setQueryData(
          listKey,
          listSnapshot.map((row) =>
            row.wizardId === wizardId ? { ...row, ...patch } : row,
          ),
        );
      }
      if (itemSnapshot) {
        queryClient.setQueryData(itemKey, { ...itemSnapshot, ...patch });
      }
      return {
        snapshot: [
          [listKey, listSnapshot],
          [itemKey, itemSnapshot],
        ] as const,
      };
    },
    getOfflineQueuedToast: () => ({
      title: "Progress saved",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Complete wizard mutation
 */
export function useCompleteWizard() {
  const queryClient = useQueryClient();
  return useFinMutation<IWizardProgressResponse, Error, string>({
    mutationFn: completeWizard,
    invalidateQueries: [queryKeys.wizardProgress],
    onMutate: async (wizardId) => {
      const listKey = queryKeys.wizardProgress();
      const itemKey = queryKeys.wizardProgressById(wizardId);
      const listSnapshot = queryClient.getQueryData<IWizardProgressResponse[]>(listKey);
      const itemSnapshot = queryClient.getQueryData<IWizardProgressResponse | null>(itemKey);
      const patch = {
        completed: true,
        percentComplete: 100,
        updatedAt: new Date().toISOString(),
      };
      if (listSnapshot) {
        queryClient.setQueryData(
          listKey,
          listSnapshot.map((row) =>
            row.wizardId === wizardId ? { ...row, ...patch } : row,
          ),
        );
      }
      if (itemSnapshot) {
        queryClient.setQueryData(itemKey, { ...itemSnapshot, ...patch });
      }
      return {
        snapshot: [
          [listKey, listSnapshot],
          [itemKey, itemSnapshot],
        ] as const,
      };
    },
    getOfflineQueuedToast: () => ({
      title: "Wizard completed",
      message: OFFLINE_MUTATION_DEFAULT_DETAIL,
    }),
  });
}

/**
 * Check if a wizard is completed
 */
export function useIsWizardCompleted(wizardId: string): boolean {
  const { data } = useWizardProgress(wizardId);
  return data?.completed ?? false;
}

/**
 * Get wizard completion percentage
 */
export function useWizardPercentComplete(wizardId: string): number {
  const { data } = useWizardProgress(wizardId);
  return data?.percentComplete ?? 0;
}
