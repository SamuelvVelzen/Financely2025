import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  RenameWorkspaceBodySchema,
  WorkspaceSummarySchema,
} from "@/features/shared/validation/schemas";
import { WorkspaceService } from "@/features/workspace/services/workspace.service";
import { parseWorkspaceIdParam } from "@/features/workspace/workspace-id";
import { json } from "@tanstack/react-start";
import { z } from "zod";

function mapWorkspace(w: {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: w.id,
    name: w.name,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

/**
 * PATCH /api/v1/me/workspaces/:workspaceId
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
      const body = RenameWorkspaceBodySchema.parse(await request.json());
      const updated = await WorkspaceService.renameWorkspace(
        userId,
        workspaceId,
        body.name,
      );
      return json(WorkspaceSummarySchema.parse(mapWorkspace(updated)));
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(
        { code: ErrorCodes.UNAUTHORIZED, message: "Unauthorized" },
        "Unauthorized",
      );
    }
    if (error instanceof Error && error.message === "Workspace not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Workspace not found", 404),
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

/**
 * DELETE /api/v1/me/workspaces/:workspaceId
 */
export async function DELETE({
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
      await WorkspaceService.deleteWorkspaceIfEmpty(userId, workspaceId);
      return json({ success: true });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(
        { code: ErrorCodes.UNAUTHORIZED, message: "Unauthorized" },
        "Unauthorized",
      );
    }
    if (error instanceof Error && error.message === "Workspace not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Workspace not found", 404),
      );
    }
    if (
      error instanceof Error &&
      (error.message.includes("not empty") ||
        error.message.includes("only workspace"))
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, error.message, 400),
      );
    }
    return createErrorResponse(error);
  }
}
