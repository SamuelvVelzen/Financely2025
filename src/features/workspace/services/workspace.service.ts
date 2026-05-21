import { prisma } from "@/features/util/prisma";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

const DEFAULT_WORKSPACE_NAME = "Personal";

/**
 * Solo workspaces: one owner per workspace (v1).
 * Delete is only allowed when the workspace has no financial rows.
 */
export class WorkspaceService {
  /** Ensures at least one workspace exists (e.g. legacy or edge signup). */
  static async ensureAtLeastOneWorkspace(userId: string): Promise<void> {
    const n = await prisma.workspace.count({ where: { userId } });
    if (n === 0) {
      await prisma.workspace.create({
        data: { userId, name: DEFAULT_WORKSPACE_NAME },
      });
    }
  }

  static async listForUser(userId: string) {
    return prisma.workspace.findMany({
      where: { userId },
      orderBy: [{ createdAt: "asc" }],
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  static async createWorkspace(userId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Workspace name is required");
    }
    return prisma.workspace.create({
      data: { userId, name: trimmed },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  static async renameWorkspace(
    userId: string,
    workspaceId: IWorkspaceId,
    name: string,
  ) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Workspace name is required");
    }
    const ws = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });
    if (!ws) {
      throw new Error("Workspace not found");
    }
    return prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: trimmed },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  /**
   * Deletes workspace only if it has no domain data (solo v1 safety).
   */
  static async deleteWorkspaceIfEmpty(
    userId: string,
    workspaceId: IWorkspaceId,
  ) {
    const ws = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });
    if (!ws) {
      throw new Error("Workspace not found");
    }

    const count =
      (await prisma.transaction.count({ where: { workspaceId } })) +
      (await prisma.tag.count({ where: { workspaceId } })) +
      (await prisma.budget.count({ where: { workspaceId } })) +
      (await prisma.message.count({ where: { workspaceId } })) +
      (await prisma.subscription.count({ where: { workspaceId } })) +
      (await prisma.subscriptionDismissal.count({ where: { workspaceId } }));

    if (count > 0) {
      throw new Error(
        "Workspace is not empty. Remove or move its data before deleting.",
      );
    }

    const total = await prisma.workspace.count({ where: { userId } });
    if (total <= 1) {
      throw new Error("Cannot delete your only workspace.");
    }

    await prisma.workspace.delete({ where: { id: workspaceId } });
  }

  static async getDefaultWorkspaceIdForUser(
    userId: string,
  ): Promise<IWorkspaceId> {
    const first = await prisma.workspace.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (first) {
      return first.id;
    }
    const created = await prisma.workspace.create({
      data: { userId, name: DEFAULT_WORKSPACE_NAME },
      select: { id: true },
    });
    return created.id;
  }
}
