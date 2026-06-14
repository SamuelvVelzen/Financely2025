import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  UpdateWorkspaceSettingInputSchema,
  WorkspaceSettingSchema,
} from "@/features/shared/validation/schemas";
import { WorkspaceSettingService } from "@/features/workspace/services/workspace-setting.service";
import { parseWorkspaceIdParam } from "@/features/workspace/workspace-id";
import { json } from "@tanstack/react-start";
import { z } from "zod";

/**
 * GET /api/v1/me/workspaces/:workspaceId/settings
 */
export async function GET({
  params,
}: {
  params: { workspaceId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const workspaceId = parseWorkspaceIdParam(params.workspaceId);
      if (workspaceId === null) {
        return createErrorResponse(
          new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid workspace id", 400),
        );
      }
      const setting = await WorkspaceSettingService.getWorkspaceSetting(
        userId,
        workspaceId,
      );
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
 * PATCH /api/v1/me/workspaces/:workspaceId/settings
 */
export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const workspaceId = parseWorkspaceIdParam(params.workspaceId);
      if (workspaceId === null) {
        return createErrorResponse(
          new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid workspace id", 400),
        );
      }
      const body = UpdateWorkspaceSettingInputSchema.parse(
        await request.json(),
      );
      try {
        const updated = await WorkspaceSettingService.upsertWorkspaceSetting(
          userId,
          workspaceId,
          body,
        );
        return json(WorkspaceSettingSchema.parse(updated));
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
