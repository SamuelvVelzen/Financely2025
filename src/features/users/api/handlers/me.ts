import { withAuth } from "@/features/auth/context";
import { createErrorResponse, ErrorCodes } from "@/features/shared/api/errors";
import { UserService } from "@/features/users/services/user.service";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/me
 * Returns the current authenticated user
 */
export async function GET({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const user = await UserService.getUserById(userId);

      if (!user) {
        return createErrorResponse(
          new Error("User not found"),
          "User not found"
        );
      }

      return json(user);
    });
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
