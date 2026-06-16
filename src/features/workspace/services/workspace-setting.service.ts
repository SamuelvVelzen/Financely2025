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
  smartTaggingEnabled: boolean;
  historyLearningEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): IWorkspaceSetting {
  return WorkspaceSettingSchema.parse({
    workspaceId: row.workspaceId,
    defaultCurrency:
      row.defaultCurrency && isSupportedCurrency(row.defaultCurrency)
        ? row.defaultCurrency
        : null,
    smartTaggingEnabled: row.smartTaggingEnabled,
    historyLearningEnabled: row.historyLearningEnabled,
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
        smartTaggingEnabled: data.smartTaggingEnabled ?? true,
        historyLearningEnabled: data.historyLearningEnabled ?? true,
      },
      update: {
        ...(data.defaultCurrency !== undefined && {
          defaultCurrency: data.defaultCurrency,
        }),
        ...(data.smartTaggingEnabled !== undefined && {
          smartTaggingEnabled: data.smartTaggingEnabled,
        }),
        ...(data.historyLearningEnabled !== undefined && {
          historyLearningEnabled: data.historyLearningEnabled,
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

  static async resolveSmartTaggingEnabled(
    userId: string,
    workspaceId: IWorkspaceId,
  ): Promise<boolean> {
    const setting = await this.getWorkspaceSetting(userId, workspaceId);
    return setting?.smartTaggingEnabled ?? true;
  }

  static seedDefaultCurrencyFromBrowser(): ICurrency {
    return getBrowserCurrency();
  }
}
