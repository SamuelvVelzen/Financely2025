import { createErrorResponse, ErrorCodes } from "@/lib/api/errors";
import { withAuth } from "@/lib/auth/context";
import { UserService } from "@/lib/services/user.service";
import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";

export const Route = createFileRoute("/api/me")({
  server: {
    handlers: {
      /**
       * GET /api/me
       * Returns the current authenticated user
       */
      GET: async () => {
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
      },
    },
  },
});
