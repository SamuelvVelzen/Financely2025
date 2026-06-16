import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
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
        const result = await TagRuleService.discoverFromHistory(
          userId,
          workspaceId,
        );
        return json(result);
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
