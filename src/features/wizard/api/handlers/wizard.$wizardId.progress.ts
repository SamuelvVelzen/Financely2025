import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { WizardService } from "@/features/wizard/services/wizard.service";
import { json } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Schema for updating wizard progress
 */
const UpdateWizardProgressSchema = z.object({
  currentStepIndex: z.number().int().min(0),
  totalSteps: z.number().int().min(1),
});

/**
 * GET /api/v1/wizard/:wizardId/progress
 * Get progress for a specific wizard
 */
export async function GET({
  params,
}: {
  request: Request;
  params: { wizardId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const result = await WizardService.getWizardProgress(
        userId,
        params.wizardId
      );

      // Return null if no progress exists (wizard not started)
      return json(result);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * PUT /api/v1/wizard/:wizardId/progress
 * Update progress for a specific wizard
 */
export async function PUT({
  request,
  params,
}: {
  request: Request;
  params: { wizardId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = await request.json();
      const validated = UpdateWizardProgressSchema.parse(body);

      const result = await WizardService.updateWizardProgress(
        userId,
        params.wizardId,
        validated.currentStepIndex,
        validated.totalSteps
      );

      return json(result);
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          "Invalid progress data",
          400
        )
      );
    }
    return createErrorResponse(error);
  }
}

