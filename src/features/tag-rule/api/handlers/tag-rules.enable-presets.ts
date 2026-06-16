import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { EnableTagRulePresetsInputSchema } from "@/features/shared/validation/schemas";
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
        const validated = EnableTagRulePresetsInputSchema.parse(body);
        const result = await TagRuleService.enablePresets(
          userId,
          workspaceId,
          validated,
        );
        return json(result, { status: 201 });
      },
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}
