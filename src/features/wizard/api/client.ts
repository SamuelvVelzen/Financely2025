import { apiGet, apiPost, apiPut } from "@/features/shared/api/client";
import type { IWizardProgressResponse } from "@/features/wizard/services/wizard.service";

/**
 * Wizard API Client
 * Client-side functions for interacting with wizard progress endpoints
 */

/**
 * Get all wizard progress for the current user
 */
export async function getAllWizardProgress(): Promise<IWizardProgressResponse[]> {
  return apiGet<IWizardProgressResponse[]>("/wizard/progress");
}

/**
 * Get progress for a specific wizard
 */
export async function getWizardProgress(
  wizardId: string
): Promise<IWizardProgressResponse | null> {
  return apiGet<IWizardProgressResponse | null>(
    `/wizard/${wizardId}/progress`
  );
}

/**
 * Update progress for a specific wizard
 */
export async function updateWizardProgress(
  wizardId: string,
  currentStepIndex: number,
  totalSteps: number
): Promise<IWizardProgressResponse> {
  return apiPut<IWizardProgressResponse>(`/wizard/${wizardId}/progress`, {
    currentStepIndex,
    totalSteps,
  });
}

/**
 * Mark a wizard as completed
 */
export async function completeWizard(
  wizardId: string
): Promise<IWizardProgressResponse> {
  return apiPost<IWizardProgressResponse>(`/wizard/${wizardId}/complete`, {});
}
