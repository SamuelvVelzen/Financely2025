import { withAuth } from "@/features/auth/context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { WizardService } from "@/features/wizard/services/wizard.service";
import { json } from "@tanstack/react-start";

/**
 * POST /api/v1/wizard/:wizardId/complete
 * Mark a wizard as completed
 */
export async function POST({
  params,
}: {
  request: Request;
  params: { wizardId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const result = await WizardService.completeWizard(
        userId,
        params.wizardId
      );

      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
