import { requireAuth } from "@/features/auth/server";
import { createErrorResponse, ErrorCodes } from "@/features/shared/api/errors";
import { UserProfileSchema } from "@/features/shared/validation/schemas";
import { prisma } from "@/features/util/prisma";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/me/profile
 * Returns the current authenticated user's profile (UserInfo)
 */
export async function GET() {
  try {
    const session = await requireAuth();

    // session.user.id is the UserInfo ID
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: session.user.id },
    });

    if (!userInfo) {
      return createErrorResponse(
        { code: ErrorCodes.NOT_FOUND, message: "Profile not found" },
        "Profile not found"
      );
    }

    const profile = UserProfileSchema.parse({
      id: userInfo.id,
      email: userInfo.email,
      emailVerified: userInfo.emailVerified,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      suffix: userInfo.suffix,
      name: userInfo.name,
      image: userInfo.image,
      createdAt: userInfo.createdAt.toISOString(),
      updatedAt: userInfo.updatedAt.toISOString(),
    });

    return json(profile);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return createErrorResponse(
        { code: ErrorCodes.UNAUTHORIZED, message: "Unauthorized" },
        "Unauthorized"
      );
    }
    return createErrorResponse(error);
  }
}
