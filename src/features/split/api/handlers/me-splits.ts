import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  AddSplitMemberInputSchema,
  CreateSplitExpenseInputSchema,
  CreateSplitGroupInputSchema,
  CreateSplitSettlementInputSchema,
  SetSplitExpenseAddToTransactionsInputSchema,
  UpdateSplitExpenseInputSchema,
  UpdateSplitGroupInputSchema,
  UpdateSplitSettlementInputSchema,
} from "@/features/shared/validation/schemas";
import { getGuestSessionIdFromRequest } from "@/features/split/auth/split-guest-access";
import { SplitBalanceService } from "@/features/split/services/split-balance.service";
import { SplitExpenseService } from "@/features/split/services/split-expense.service";
import { SplitGroupService } from "@/features/split/services/split-group.service";
import { SplitSettlementService } from "@/features/split/services/split-settlement.service";
import { json } from "@tanstack/react-start";
import { z } from "zod";

function handleSplitError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Invalid share link") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, error.message, 404),
      );
    }
    if (error.message === "Not a member of this group") {
      return createErrorResponse(
        new ApiError(ErrorCodes.UNAUTHORIZED, error.message, 403),
      );
    }
    if (
      error.message.includes("Not allowed") ||
      error.message.includes("Only ")
    ) {
      return createErrorResponse(
        new ApiError(ErrorCodes.UNAUTHORIZED, error.message, 403),
      );
    }
  }
  return createErrorResponse(error);
}

export async function listGroupsGET() {
  try {
    return await withAuth(async (userId) => {
      const groups = await SplitGroupService.listGroups(userId);
      return json({ groups });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function createGroupPOST({ request }: { request: Request }) {
  try {
    return await withAuth(async (userId) => {
      const body = CreateSplitGroupInputSchema.parse(await request.json());
      const group = await SplitGroupService.createGroup(userId, body);
      return json(group, { status: 201 });
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

export async function summaryGET() {
  try {
    return await withAuth(async (userId) => {
      const summary = await SplitBalanceService.getSummaryForUser(userId);
      return json(summary);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function groupGET({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const group = await SplitGroupService.getGroup(params.groupId, userId);
      return json(group);
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function groupPATCH({
  request,
  params,
}: {
  request: Request;
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = UpdateSplitGroupInputSchema.parse(await request.json());
      const group = await SplitGroupService.updateGroup(
        params.groupId,
        userId,
        body,
      );
      return json(group);
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function groupDELETE({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      await SplitGroupService.deleteGroup(params.groupId, userId);
      return json({ success: true });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function addMemberPOST({
  request,
  params,
}: {
  request: Request;
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = AddSplitMemberInputSchema.parse(await request.json());
      const member = await SplitGroupService.addMember(
        params.groupId,
        userId,
        body,
      );
      return json(member, { status: 201 });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function removeMemberDELETE({
  params,
}: {
  params: { groupId: string; memberId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      await SplitGroupService.removeMember(
        params.groupId,
        userId,
        params.memberId,
      );
      return json({ success: true });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function listExpensesGET({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const expenses = await SplitExpenseService.listExpenses(
        params.groupId,
        userId,
      );
      return json({ expenses });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function createExpensePOST({
  request,
  params,
}: {
  request: Request;
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = CreateSplitExpenseInputSchema.parse(await request.json());
      const expense = await SplitExpenseService.createExpense(
        params.groupId,
        userId,
        body,
      );
      return json(expense, { status: 201 });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function updateExpensePATCH({
  request,
  params,
}: {
  request: Request;
  params: { groupId: string; expenseId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = UpdateSplitExpenseInputSchema.parse(await request.json());
      const expense = await SplitExpenseService.updateExpense(
        params.groupId,
        params.expenseId,
        userId,
        body,
      );
      return json(expense);
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function setExpenseAddToTransactionsPATCH({
  request,
  params,
}: {
  request: Request;
  params: { groupId: string; expenseId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = SetSplitExpenseAddToTransactionsInputSchema.parse(
        await request.json(),
      );
      const expense = await SplitExpenseService.setAddToTransactions(
        params.groupId,
        params.expenseId,
        userId,
        body.addToTransactions,
      );
      return json(expense);
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function deleteExpenseDELETE({
  params,
}: {
  params: { groupId: string; expenseId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      await SplitExpenseService.deleteExpense(
        params.groupId,
        params.expenseId,
        userId,
      );
      return json({ success: true });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function convertExpensePOST({
  params,
}: {
  params: { groupId: string; expenseId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const expense = await SplitExpenseService.convertExpense(
        params.groupId,
        params.expenseId,
        userId,
      );
      return json(expense);
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function convertPendingPOST({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const result = await SplitExpenseService.convertAllPending(
        params.groupId,
        userId,
      );
      return json(result);
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function balancesGET({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const balances = await SplitBalanceService.getBalances(params.groupId, {
        viewerUserId: userId,
      });
      return json(balances);
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function listSettlementsGET({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const settlements = await SplitSettlementService.listSettlements(
        params.groupId,
        userId,
      );
      return json({ settlements });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function createSettlementPOST({
  request,
  params,
}: {
  request: Request;
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = CreateSplitSettlementInputSchema.parse(await request.json());
      const settlement = await SplitSettlementService.createSettlement(
        params.groupId,
        userId,
        body,
      );
      return json(settlement, { status: 201 });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function updateSettlementPATCH({
  request,
  params,
}: {
  request: Request;
  params: { groupId: string; settlementId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const body = UpdateSplitSettlementInputSchema.parse(await request.json());
      const settlement = await SplitSettlementService.updateSettlement(
        params.settlementId,
        userId,
        body,
      );
      return json(settlement);
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function deleteSettlementDELETE({
  params,
}: {
  params: { groupId: string; settlementId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      await SplitSettlementService.deleteSettlement(params.settlementId, userId);
      return json({ success: true });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function rotateGuestLinkPOST({
  params,
}: {
  params: { groupId: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const token = await SplitGroupService.rotateGuestLink(
        params.groupId,
        userId,
      );
      return json({ guestAccessToken: token });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}

export async function joinByInviteTokenPOST({
  request,
  params,
}: {
  request: Request;
  params: { token: string };
}) {
  try {
    return await withAuth(async (userId) => {
      const result = await SplitGroupService.joinAsUser(
        params.token,
        userId,
        getGuestSessionIdFromRequest(request),
      );
      return json(result, { status: 201 });
    });
  } catch (error) {
    return handleSplitError(error);
  }
}
