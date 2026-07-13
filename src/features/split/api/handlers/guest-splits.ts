import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  CreateSplitExpenseInputSchema,
  GuestJoinInputSchema,
} from "@/features/shared/validation/schemas";
import {
  assertGuestCan,
  getGroupByGuestToken,
  GUEST_SESSION_COOKIE,
  requireGuestAccess,
} from "@/features/split/auth/split-guest-access";
import { SplitBalanceService } from "@/features/split/services/split-balance.service";
import { SplitExpenseService } from "@/features/split/services/split-expense.service";
import { SplitGroupService } from "@/features/split/services/split-group.service";
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
    return createErrorResponse(error);
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
    const balances = await SplitBalanceService.getBalances(group.id);
    const members = await SplitGroupService.listActiveMembers(group.id);

    return json({
      group: {
        id: group.id,
        name: group.name,
        defaultCurrency: group.defaultCurrency,
        guestCanAdd: group.guestCanAdd,
      },
      member: {
        id: member.id,
        displayName: member.displayName,
      },
      members,
      expenses,
      balances,
    });
  } catch (error) {
    return createErrorResponse(error);
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
    return createErrorResponse(error);
  }
}
