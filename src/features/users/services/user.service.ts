import {
  UserSchema,
  type UserResponse,
} from "@/features/shared/validation/schemas";
import { prisma } from "@/util/prisma";

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
  static async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return UserSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  }

  /**
   * Get or create user by email
   * Useful for development/mock scenarios
   */
  static async getOrCreateUser(
    email: string,
    name?: string
  ): Promise<UserResponse> {
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return UserSchema.parse({
        id: existing.id,
        email: existing.email,
        name: existing.name,
        createdAt: existing.createdAt.toISOString(),
        updatedAt: existing.updatedAt.toISOString(),
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    return UserSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  }
}
