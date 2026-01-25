import { useFinMutation, useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import {
  completeWizard,
  getAllWizardProgress,
  getWizardProgress,
  updateWizardProgress,
} from "@/features/wizard/api/client";
import type { IWizardProgressResponse } from "@/features/wizard/services/wizard.service";

/**
 * Query all wizard progress for the current user
 * - staleTime: 5 minutes (wizard progress doesn't change often)
 */
export function useAllWizardProgress() {
  return useFinQuery<IWizardProgressResponse[], Error>({
    queryKey: queryKeys.wizardProgress(),
    queryFn: getAllWizardProgress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Query progress for a specific wizard
 * - staleTime: 5 minutes
 */
export function useWizardProgress(wizardId: string) {
  return useFinQuery<IWizardProgressResponse | null, Error>({
    queryKey: queryKeys.wizardProgressById(wizardId),
    queryFn: () => getWizardProgress(wizardId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Update wizard progress mutation
 * - Invalidates wizard progress queries on success
 */
export function useUpdateWizardProgress() {
  return useFinMutation<
    IWizardProgressResponse,
    Error,
    { wizardId: string; currentStepIndex: number; totalSteps: number }
  >({
    mutationFn: ({ wizardId, currentStepIndex, totalSteps }) =>
      updateWizardProgress(wizardId, currentStepIndex, totalSteps),
    invalidateQueries: [queryKeys.wizardProgress],
  });
}

/**
 * Complete wizard mutation
 * - Invalidates wizard progress queries on success
 */
export function useCompleteWizard() {
  return useFinMutation<IWizardProgressResponse, Error, string>({
    mutationFn: completeWizard,
    invalidateQueries: [queryKeys.wizardProgress],
  });
}

/**
 * Check if a wizard is completed
 * Returns true if the wizard exists and is marked as completed
 */
export function useIsWizardCompleted(wizardId: string): boolean {
  const { data } = useWizardProgress(wizardId);
  return data?.completed ?? false;
}

/**
 * Get wizard completion percentage
 * Returns 0-100 based on current progress
 */
export function useWizardPercentComplete(wizardId: string): number {
  const { data } = useWizardProgress(wizardId);
  return data?.percentComplete ?? 0;
}
