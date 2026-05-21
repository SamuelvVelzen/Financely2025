import {
  formatFullName,
  UserResponseSchema,
  type IUserResponse,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import { WorkspaceService } from "@/features/workspace/services/workspace.service";

/**
 * User Service
 * Handles user-related business logic and data access
 */
export class UserService {
  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User response or null if not found
   */
  static async getUserById(userId: string): Promise<IUserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userInfo: true },
    });

    if (!user || !user.userInfo) {
      return null;
    }

    await WorkspaceService.ensureAtLeastOneWorkspace(user.id);
    const workspaces = await WorkspaceService.listForUser(user.id);

    const name = formatFullName(
      user.userInfo.firstName,
      user.userInfo.lastName,
      user.userInfo.suffix
    );

    return UserResponseSchema.parse({
      id: user.id,
      email: user.userInfo.email,
      name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      workspaces: workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
    });
  }

  /**
   * Get or create user by email
   * Useful for development/mock scenarios
   * @param email - User email
   * @param name - Legacy name parameter (will be split into firstName/lastName)
   * @param firstName - First name (optional)
   * @param lastName - Last name (optional)
   * @param suffix - Suffix (optional)
   */
  static async getOrCreateUser(
    email: string,
    firstName: string,
    lastName: string,
    suffix?: string
  ): Promise<IUserResponse> {
    const normalizedEmail = email.toLowerCase().trim();

    const existingInfo = await prisma.userInfo.findUnique({
      where: { email: normalizedEmail },
      include: { user: true },
    });

    if (existingInfo?.user) {
      const full = await this.getUserById(existingInfo.user.id);
      if (!full) {
        throw new Error("User record inconsistent");
      }
      return full;
    }

    const displayName =
      formatFullName(firstName, lastName, suffix) ??
      `${firstName} ${lastName}`.trim();

    const userInfo = await prisma.userInfo.create({
      data: {
        email: normalizedEmail,
        emailVerified: true,
        firstName,
        lastName,
        suffix: suffix ?? null,
        name: displayName,
      },
    });

    const appUser = await prisma.user.create({
      data: {
        userInfoId: userInfo.id,
        workspaces: {
          create: [{ name: "Personal" }],
        },
      },
    });

    const full = await this.getUserById(appUser.id);
    if (!full) {
      throw new Error("Failed to load created user");
    }
    return full;
  }
}
