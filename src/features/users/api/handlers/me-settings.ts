import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  UpdateUserSettingInputSchema,
  UserSettingSchema,
} from "@/features/shared/validation/schemas";
import { UserSettingService } from "@/features/users/services/user-setting.service";
import { json } from "@tanstack/react-start";
import { z } from "zod";

/**
 * GET /api/v1/me/settings
 */
export async function GET() {
  try {
    return await withAuth(async (userId) => {
      const setting = await UserSettingService.getUserSetting(userId);
      return json(setting);
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(
        { code: ErrorCodes.UNAUTHORIZED, message: "Unauthorized" },
        "Unauthorized",
      );
    }
    return createErrorResponse(error);
  }
}

/**
 * PUT /api/v1/me/settings
 */
export async function PUT({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = UpdateUserSettingInputSchema.parse(await request.json());
      try {
        const updated = await UserSettingService.upsertUserSetting(
          userId,
          body,
        );
        return json(UserSettingSchema.parse(updated));
      } catch (err) {
        if (err instanceof Error && err.message === "Workspace not found") {
          return createErrorResponse(
            new ApiError(ErrorCodes.NOT_FOUND, "Workspace not found", 404),
          );
        }
        throw err;
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(
        { code: ErrorCodes.UNAUTHORIZED, message: "Unauthorized" },
        "Unauthorized",
      );
    }
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid body", 400),
      );
    }
    return createErrorResponse(error);
  }
}
