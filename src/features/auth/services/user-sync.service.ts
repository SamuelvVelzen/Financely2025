/**
 * User Sync Service
 * 
 * Syncs BetterAuth user data to the app User table.
 * Called after successful authentication to keep data in sync.
 */

import { prisma } from "@/util/prisma";

interface SyncUserParams {
  betterAuthUserId: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
  image?: string | null;
}

/**
 * Sync BetterAuth user to app User table
 * Creates or updates the app User record based on BetterAuth user data
 */
export async function syncUserToAppUser(params: SyncUserParams): Promise<void> {
  const { betterAuthUserId, email, name, emailVerified, image } = params;

  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase().trim();

  // Check if app User already exists by email or betterAuthUserId
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { betterAuthUserId },
      ],
    },
  });

  if (existingUser) {
    // Update existing user
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email: normalizedEmail,
        primaryEmail: normalizedEmail,
        isEmailVerified: emailVerified || false,
        betterAuthUserId,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new user
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        primaryEmail: normalizedEmail,
        isEmailVerified: emailVerified || false,
        betterAuthUserId,
        lastLoginAt: new Date(),
        status: "ACTIVE",
      },
    });

    // Also create UserInfo if name or image is provided
    if (name || image) {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (user) {
        await prisma.userInfo.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            firstName: name ? name.split(" ")[0] : null,
            lastName: name && name.split(" ").length > 1 ? name.split(" ").slice(1).join(" ") : null,
            avatar_url: image || null,
          },
          update: {
            firstName: name ? name.split(" ")[0] : null,
            lastName: name && name.split(" ").length > 1 ? name.split(" ").slice(1).join(" ") : null,
            avatar_url: image || null,
          },
        });
      }
    }
  }
}

/**
 * Update lastLoginAt for a user
 */
export async function updateLastLoginAt(betterAuthUserId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { betterAuthUserId },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}


