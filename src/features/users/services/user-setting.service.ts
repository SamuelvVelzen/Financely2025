import type {
  ITheme,
  IUpdateUserSettingInput,
  IUserSetting,
} from "@/features/shared/validation/schemas";
import { UserSettingSchema } from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import { getBrowserLanguage } from "@/features/users/utils/browser-defaults";
import { resolveUserTheme } from "@/features/users/utils/resolve-user-theme";
import type { IWorkspaceId } from "@/features/workspace/workspace-id";

const DEFAULT_LANGUAGE = "nl-NL";

function mapUserSetting(row: {
  id: string;
  defaultLanguage: string | null;
  defaultWorkspaceId: number | null;
  theme: string | null;
  createdAt: Date;
  updatedAt: Date;
}): IUserSetting {
  return UserSettingSchema.parse({
    id: row.id,
    defaultLanguage: row.defaultLanguage,
    defaultWorkspaceId: row.defaultWorkspaceId,
    theme: row.theme as ITheme | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export class UserSettingService {
  static async getUserSetting(userId: string): Promise<IUserSetting | null> {
    const row = await prisma.userSetting.findUnique({
      where: { userId },
    });
    return row ? mapUserSetting(row) : null;
  }

  static async upsertUserSetting(
    userId: string,
    data: IUpdateUserSettingInput,
  ): Promise<IUserSetting> {
    if (data.defaultWorkspaceId != null) {
      const workspace = await prisma.workspace.findFirst({
        where: { id: data.defaultWorkspaceId, userId },
      });
      if (!workspace) {
        throw new Error("Workspace not found");
      }
    }

    const row = await prisma.userSetting.upsert({
      where: { userId },
      create: {
        userId,
        defaultLanguage: data.defaultLanguage ?? null,
        defaultWorkspaceId: data.defaultWorkspaceId ?? null,
        theme: data.theme ?? null,
      },
      update: {
        ...(data.defaultLanguage !== undefined && {
          defaultLanguage: data.defaultLanguage,
        }),
        ...(data.defaultWorkspaceId !== undefined && {
          defaultWorkspaceId: data.defaultWorkspaceId,
        }),
        ...(data.theme !== undefined && { theme: data.theme }),
      },
    });

    return mapUserSetting(row);
  }

  static resolveDefaultWorkspaceId(
    setting: IUserSetting | null | undefined,
    workspaceIds: IWorkspaceId[],
  ): IWorkspaceId | null {
    if (setting?.defaultWorkspaceId != null) {
      if (workspaceIds.includes(setting.defaultWorkspaceId)) {
        return setting.defaultWorkspaceId;
      }
    }
    return workspaceIds[0] ?? null;
  }

  static resolveUserLocale(setting: IUserSetting | null | undefined): string {
    if (setting?.defaultLanguage) {
      return setting.defaultLanguage;
    }
    return getBrowserLanguage() || DEFAULT_LANGUAGE;
  }

  static resolveUserTheme = resolveUserTheme;
}
