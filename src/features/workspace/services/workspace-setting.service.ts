import type { ICurrency } from "@/features/currency/config/currencies";
import type {
  IUpdateWorkspaceSettingInput,
  IWorkspaceSetting,
} from "@/features/shared/validation/schemas";
import { WorkspaceSettingSchema } from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import {
  getBrowserCurrency,
  isSupportedCurrency,
} from "@/features/users/utils/browser-defaults";
import { resolveDefaultCurrencyFromSetting } from "@/features/workspace/utils/resolve-default-currency";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

function mapWorkspaceSetting(row: {
  workspaceId: number;
  defaultCurrency: string | null;
  createdAt: Date;
  updatedAt: Date;
}): IWorkspaceSetting {
  return WorkspaceSettingSchema.parse({
    workspaceId: row.workspaceId,
    defaultCurrency:
      row.defaultCurrency && isSupportedCurrency(row.defaultCurrency)
        ? row.defaultCurrency
        : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export class WorkspaceSettingService {
  static async getWorkspaceSetting(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<IWorkspaceSetting | null> {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
      select: { id: true },
    });
    if (!workspace) {
      return null;
    }

    const setting = await prisma.workspaceSetting.findUnique({
      where: { workspaceId },
    });
    if (!setting) {
      return null;
    }

    return mapWorkspaceSetting(setting);
  }

  static async upsertWorkspaceSetting(
    userId: string,
    workspaceId: IWorkspaceId,
    data: IUpdateWorkspaceSettingInput,
  ): Promise<IWorkspaceSetting> {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId },
    });
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const row = await prisma.workspaceSetting.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        defaultCurrency: data.defaultCurrency ?? null,
      },
      update: {
        ...(data.defaultCurrency !== undefined && {
          defaultCurrency: data.defaultCurrency,
        }),
      },
    });

    return mapWorkspaceSetting(row);
  }

  static async resolveDefaultCurrency(
    workspaceId: IWorkspaceId,
    userId: string,
  ): Promise<ICurrency> {
    const setting = await this.getWorkspaceSetting(userId, workspaceId);
    return resolveDefaultCurrencyFromSetting(setting);
  }

  static seedDefaultCurrencyFromBrowser(): ICurrency {
    return getBrowserCurrency();
  }
}
