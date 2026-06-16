import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TagRuleService } from "@/features/tag-rule/services/tag-rule.service";
import { json } from "@tanstack/react-start";

export async function PATCH({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string; ruleId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const body = await request.json();
        const result = await TagRuleService.updateRule(
          userId,
          workspaceId,
          params.ruleId,
          body,
        );
        return json(result);
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Tag rule not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Tag rule not found", 404),
      );
    }
    if (error instanceof Error && error.message === "Tag not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Tag not found", 404),
      );
    }
    return createErrorResponse(error);
  }
}

export async function DELETE({
  params,
}: {
  request: Request;
  params: { workspaceId: string; ruleId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        await TagRuleService.deleteRule(userId, workspaceId, params.ruleId);
        return json({ success: true });
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Tag rule not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Tag rule not found", 404),
      );
    }
    return createErrorResponse(error);
  }
}
