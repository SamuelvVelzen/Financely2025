import { formatFullName } from "@/features/shared/validation/schemas";
import { prisma } from "@/util/prisma";

// Re-export for convenience
export { formatFullName };

/**
 * UserInfo Service
 * Handles user information-related business logic and data access
 */
export class UserInfoService {
  /**
   * Get UserInfo by userId
   * @param userId - User ID
   * @returns UserInfo or null if not found
   */
  static async getUserInfoByUserId(userId: string) {
    return await prisma.userInfo.findUnique({
      where: { userId },
    });
  }

  /**
   * Create UserInfo
   * @param userId - User ID
   * @param data - UserInfo data
   * @returns Created UserInfo
   */
  static async createUserInfo(
    userId: string,
    data: {
      firstName?: string | null;
      lastName?: string | null;
      suffix?: string | null;
      avatar_url?: string | null;
    }
  ) {
    return await prisma.userInfo.create({
      data: {
        userId,
        firstName: data.firstName ?? null,
        lastName: data.lastName ?? null,
        suffix: data.suffix ?? null,
        avatar_url: data.avatar_url ?? null,
      },
    });
  }

  /**
   * Update UserInfo
   * @param userId - User ID
   * @param data - UserInfo data to update
   * @returns Updated UserInfo
   */
  static async updateUserInfo(
    userId: string,
    data: {
      firstName?: string | null;
      lastName?: string | null;
      suffix?: string | null;
      avatar_url?: string | null;
    }
  ) {
    return await prisma.userInfo.update({
      where: { userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.suffix !== undefined && { suffix: data.suffix }),
        ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
      },
    });
  }

  /**
   * Get or create UserInfo
   * @param userId - User ID
   * @param data - UserInfo data (optional)
   * @returns UserInfo
   */
  static async getOrCreateUserInfo(
    userId: string,
    data?: {
      firstName?: string | null;
      lastName?: string | null;
      suffix?: string | null;
      avatar_url?: string | null;
    }
  ) {
    const existing = await this.getUserInfoByUserId(userId);

    if (existing) {
      return existing;
    }

    return await this.createUserInfo(userId, data ?? {});
  }
}

