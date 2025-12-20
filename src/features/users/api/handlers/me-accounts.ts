import { requireAuth } from "@/features/auth/server";
import { createErrorResponse, ErrorCodes } from "@/features/shared/api/errors";
import { ConnectedAccountsResponseSchema } from "@/features/shared/validation/schemas";
import { prisma } from "@/util/prisma";
import { json } from "@tanstack/react-start";

/**
 * GET /api/v1/me/accounts
 * Returns the current user's connected accounts (OAuth providers)
 */
export async function GET() {
  try {
    const session = await requireAuth();

    // Get all accounts for this user
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        providerId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Check if user has a password (credential account)
    const hasPassword = accounts.some(
      (account) => account.providerId === "credential"
    );

    const response = ConnectedAccountsResponseSchema.parse({
      accounts: accounts.map((account) => ({
        id: account.id,
        providerId: account.providerId,
        createdAt: account.createdAt.toISOString(),
      })),
      hasPassword,
    });

    return json(response);
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

/**
 * DELETE /api/v1/me/accounts/:accountId
 * Unlink a social account from the current user
 */
export async function DELETE({ request }: { request: Request }) {
  try {
    const session = await requireAuth();
    const url = new URL(request.url);
    const accountId = url.pathname.split("/").pop();

    if (!accountId) {
      return createErrorResponse(
        { code: ErrorCodes.VALIDATION_ERROR, message: "Account ID required" },
        "Account ID required"
      );
    }

    // Get all user's accounts to check if this is the last one
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
    });

    if (accounts.length <= 1) {
      return createErrorResponse(
        {
          code: ErrorCodes.VALIDATION_ERROR,
          message: "Cannot remove your only authentication method",
        },
        "Cannot remove your only authentication method"
      );
    }

    // Find the account to delete
    const accountToDelete = accounts.find((a) => a.id === accountId);

    if (!accountToDelete) {
      return createErrorResponse(
        { code: ErrorCodes.NOT_FOUND, message: "Account not found" },
        "Account not found"
      );
    }

    // Delete the account
    await prisma.account.delete({
      where: { id: accountId },
    });

    return json({ success: true });
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

