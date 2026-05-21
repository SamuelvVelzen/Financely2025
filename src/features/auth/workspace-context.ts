import { requireAuth } from "./context";
import { ApiError, ErrorCodes } from "@/features/shared/api/errors";
import {
  parseWorkspaceIdParam,
  type IWorkspaceId,
} from "@/features/workspace/workspace-id";
import { prisma } from "@/features/util/prisma";

export interface IWorkspaceAuthContext {
  userId: string;
  workspaceId: IWorkspaceId;
}

/**
 * Ensures the workspace exists and belongs to the app user.
 */
export async function requireWorkspaceForUser(
  userId: string,
  workspaceId: IWorkspaceId,
): Promise<{ id: number; name: string }> {
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, userId },
    select: { id: true, name: true },
  });
  if (!workspace) {
    throw new ApiError(ErrorCodes.NOT_FOUND, "Workspace not found", 404);
  }
  return workspace;
}

/**
 * API handler wrapper: authenticate, then resolve workspace ownership.
 * Accepts the raw URL segment (digits only after migration).
 */
export async function withWorkspaceAuth<T>(
  rawWorkspaceId: string,
  handler: (ctx: IWorkspaceAuthContext) => Promise<T> | T,
): Promise<T> {
  const userId = await requireAuth();
  const workspaceId = parseWorkspaceIdParam(rawWorkspaceId);
  if (workspaceId === null) {
    throw new ApiError(ErrorCodes.NOT_FOUND, "Invalid workspace id", 404);
  }
  await requireWorkspaceForUser(userId, workspaceId);
  return Promise.resolve(handler({ userId, workspaceId }));
}
