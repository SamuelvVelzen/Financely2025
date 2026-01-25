import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { WizardService } from "@/features/wizard/services/wizard.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/wizard/progress
 * Get all wizard progress for the current user
 */
export async function GET() {
  try {
    return await withAuth(async (userId) => {
      const result = await WizardService.getAllWizardProgress(userId);
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
