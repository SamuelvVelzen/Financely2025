import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  CreateSplitExpenseInputSchema,
  CreateSplitSettlementInputSchema,
  GuestJoinInputSchema,
} from "@/features/shared/validation/schemas";
import {
  assertGuestCan,
  getGroupByGuestToken,
  GUEST_SESSION_COOKIE,
  requireGuestAccess,
  SplitGuestAccessError,
} from "@/features/split/auth/split-guest-access";
import { SplitBalanceService } from "@/features/split/services/split-balance.service";
import { SplitExpenseService } from "@/features/split/services/split-expense.service";
import { SplitGroupService } from "@/features/split/services/split-group.service";
import { SplitSettlementService } from "@/features/split/services/split-settlement.service";
import { json } from "@tanstack/react-start";
import { randomBytes } from "node:crypto";
import { z } from "zod";

function getGuestSessionId(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(
    new RegExp(`${GUEST_SESSION_COOKIE}=([^;]+)`),
  );
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function guestSessionCookie(sessionId: string): string {
  return `${GUEST_SESSION_COOKIE}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

function mapGuestAccessError(error: unknown) {
  if (error instanceof SplitGuestAccessError) {
    if (error.message === "Invalid share link") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, error.message, 404),
      );
    }
    if (
      error.message === "Guest session required" ||
      error.message === "Guest session not found"
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.UNAUTHORIZED, error.message, 401),
      );
    }
    return createErrorResponse(
      new ApiError(ErrorCodes.UNAUTHORIZED, error.message, 403),
    );
  }
  if (error instanceof Error && error.message === "Invalid share link") {
    return createErrorResponse(
      new ApiError(ErrorCodes.NOT_FOUND, error.message, 404),
    );
  }
  return createErrorResponse(error);
}

export async function guestJoinPOST({
  request,
  params,
}: {
  request: Request;
  params: { token: string };
}) {
  try {
    const body = GuestJoinInputSchema.parse(await request.json());
    const group = await getGroupByGuestToken(params.token);
    if (!group) {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Invalid share link", 404),
      );
    }

    let sessionId = getGuestSessionId(request);
    if (!sessionId) {
      sessionId = randomBytes(24).toString("base64url");
    }

    const result = await SplitGroupService.joinAsGuest(
      params.token,
      body.displayName,
      sessionId,
    );

    return json(result, {
      status: 201,
      headers: { "Set-Cookie": guestSessionCookie(sessionId) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid body", 400),
      );
    }
    return mapGuestAccessError(error);
  }
}

export async function guestGroupGET({
  request,
  params,
}: {
  request: Request;
  params: { token: string };
}) {
  try {
    const { group, member } = await requireGuestAccess(
      params.token,
      getGuestSessionId(request),
    );
    assertGuestCan(group, "view");

    const expenses = await SplitExpenseService.listExpensesForGroup(group.id);
    const balances = await SplitBalanceService.getBalances(group.id, {
      viewerMemberId: member.id,
    });
    const members = await SplitGroupService.listActiveMembers(group.id);
    const settlements = await SplitSettlementService.listSettlementsForGroup(
      group.id,
    );

    return json({
      group: {
        id: group.id,
        name: group.name,
        defaultCurrency: group.defaultCurrency,
        guestCanAdd: group.guestCanAdd,
        guestCanSettle: group.guestCanSettle,
      },
      member: {
        id: member.id,
        displayName: member.displayName,
      },
      members,
      expenses,
      settlements,
      balances,
    });
  } catch (error) {
    return mapGuestAccessError(error);
  }
}

export async function guestCreateSettlementPOST({
  request,
  params,
}: {
  request: Request;
  params: { token: string };
}) {
  try {
    const { group, member } = await requireGuestAccess(
      params.token,
      getGuestSessionId(request),
    );
    assertGuestCan(group, "settle");

    const body = CreateSplitSettlementInputSchema.parse(await request.json());
    const settlement = await SplitSettlementService.createSettlementForMember(
      group.id,
      member.id,
      null,
      body,
    );

    return json(settlement, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid body", 400),
      );
    }
    return mapGuestAccessError(error);
  }
}
export async function guestCreateExpensePOST({
  request,
  params,
}: {
  request: Request;
  params: { token: string };
}) {
  try {
    const { group, member } = await requireGuestAccess(
      params.token,
      getGuestSessionId(request),
    );
    assertGuestCan(group, "add");

    const body = CreateSplitExpenseInputSchema.parse(await request.json());
    const expense = await SplitExpenseService.createExpenseForMember(
      group.id,
      member.id,
      null,
      body,
    );

    return json(expense, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        new ApiError(ErrorCodes.VALIDATION_ERROR, "Invalid body", 400),
      );
    }
    return mapGuestAccessError(error);
  }
}
