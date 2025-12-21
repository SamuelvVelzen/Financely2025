import {
  formatFullName,
  UserSchema,
  type IUserResponse,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";

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

    if (!user) {
      return null;
    }

    const name = formatFullName(
      user.userInfo?.firstName,
      user.userInfo?.lastName,
      user.userInfo?.suffix
    );

    return UserSchema.parse({
      id: user.id,
      email: user.email,
      name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
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
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { userInfo: true },
    });

    if (existing) {
      const computedName = formatFullName(
        existing.userInfo?.firstName,
        existing.userInfo?.lastName,
        existing.userInfo?.suffix
      );

      return UserSchema.parse({
        id: existing.id,
        email: existing.email,
        name: computedName,
        createdAt: existing.createdAt.toISOString(),
        updatedAt: existing.updatedAt.toISOString(),
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        userInfo: {
          create: {
            firstName: firstName ?? null,
            lastName: lastName ?? null,
            suffix: suffix ?? null,
          },
        },
      },
      include: { userInfo: true },
    });

    const computedName = formatFullName(
      user.userInfo?.firstName,
      user.userInfo?.lastName,
      user.userInfo?.suffix
    );

    return UserSchema.parse({
      id: user.id,
      email: user.email,
      name: computedName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  }
}
