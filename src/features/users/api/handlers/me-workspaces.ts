import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  CreateWorkspaceBodySchema,
  WorkspaceSummarySchema,
} from "@/features/shared/validation/schemas";
import { WorkspaceService } from "@/features/workspace/services/workspace.service";
import { json } from "@tanstack/react-start";
import { z } from "zod";

const WorkspacesListResponseSchema = z.object({
  workspaces: z.array(WorkspaceSummarySchema),
});

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
 * GET /api/v1/me/workspaces
 */
export async function GET() {
  try {
    return await withAuth(async (userId) => {
      await WorkspaceService.ensureAtLeastOneWorkspace(userId);
      const list = await WorkspaceService.listForUser(userId);
      return json(
        WorkspacesListResponseSchema.parse({
          workspaces: list.map(mapWorkspace),
        })
      );
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(
        { code: ErrorCodes.UNAUTHORIZED, message: "Unauthorized" },
        "Unauthorized"
      );
    }
    return createErrorResponse(error);
  }
}

/**
 * POST /api/v1/me/workspaces
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = CreateWorkspaceBodySchema.parse(await request.json());
      const created = await WorkspaceService.createWorkspace(userId, body.name);
      return json(WorkspaceSummarySchema.parse(mapWorkspace(created)));
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(
        { code: ErrorCodes.UNAUTHORIZED, message: "Unauthorized" },
        "Unauthorized"
      );
    }
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid body", 400)
      );
    }
    return createErrorResponse(error);
  }
}
