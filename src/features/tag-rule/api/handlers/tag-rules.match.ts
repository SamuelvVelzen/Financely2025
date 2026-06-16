import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { TagMatchRequestSchema } from "@/features/shared/validation/schemas";
import { TagRuleService } from "@/features/tag-rule/services/tag-rule.service";
import { json } from "@tanstack/react-start";

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
        const validated = TagMatchRequestSchema.parse(body);
        const result = await TagRuleService.matchTransaction(
          userId,
          workspaceId,
          validated,
        );
        return json(result);
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
