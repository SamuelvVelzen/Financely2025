import { formatFullName } from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";

// Re-export for convenience
export { formatFullName };

/**
 * UserInfo Service
 * Handles user information-related business logic and data access.
 * `userId` parameters refer to the app {@link User.id} (domain user), not UserInfo.id.
 */
export class UserInfoService {
  /**
   * Get UserInfo for an app user id.
   */
  static async getUserInfoByUserId(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userInfo: true },
    });
    return user?.userInfo ?? null;
  }

  /**
   * Create UserInfo and a {@link User} row with id `userId`.
   */
  static async createUserInfo(
    userId: string,
    data: {
      firstName?: string | null;
      lastName?: string | null;
      suffix?: string | null;
      avatar_url?: string | null;
    },
  ) {
    const firstName = data.firstName?.trim() || "User";
    const lastName = data.lastName?.trim() ?? "";
    const suffix = data.suffix?.trim() || null;
    const image = data.avatar_url?.trim() || null;

    return await prisma.$transaction(async (tx) => {
      const userInfo = await tx.userInfo.create({
        data: {
          email: `${userId}@placeholder.local`,
          firstName,
          lastName,
          suffix,
          image,
        },
      });
      await tx.user.create({
        data: {
          id: userId,
          userInfoId: userInfo.id,
        },
      });
      return userInfo;
    });
  }

  /**
   * Update UserInfo for an app user id.
   */
  static async updateUserInfo(
    userId: string,
    data: {
      firstName?: string | null;
      lastName?: string | null;
      suffix?: string | null;
      avatar_url?: string | null;
    },
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userInfoId: true },
    });
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return await prisma.userInfo.update({
      where: { id: user.userInfoId },
      data: {
        ...(data.firstName !== undefined && {
          firstName: data.firstName ?? "",
        }),
        ...(data.lastName !== undefined && { lastName: data.lastName ?? "" }),
        ...(data.suffix !== undefined && { suffix: data.suffix }),
        ...(data.avatar_url !== undefined && { image: data.avatar_url }),
      },
    });
  }

  /**
   * Get or create UserInfo (and app user) for `userId`.
   */
  static async getOrCreateUserInfo(
    userId: string,
    data?: {
      firstName?: string | null;
      lastName?: string | null;
      suffix?: string | null;
      avatar_url?: string | null;
    },
  ) {
    const existing = await this.getUserInfoByUserId(userId);

    if (existing) {
      return existing;
    }

    return await this.createUserInfo(userId, data ?? {});
  }
}
