import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { TagRuleService } from "@/features/tag-rule/services/tag-rule.service";
import { json } from "@tanstack/react-start";

export async function GET({
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const result = await TagRuleService.listRules(userId, workspaceId);
        return json(result);
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
        const body = await request.json();
        const result = await TagRuleService.createRule(
          userId,
          workspaceId,
          body,
        );
        return json(result, { status: 201 });
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Tag not found") {
      return createErrorResponse(
        new ApiError(ErrorCodes.NOT_FOUND, "Tag not found", 404),
      );
    }
    return createErrorResponse(error);
  }
}
