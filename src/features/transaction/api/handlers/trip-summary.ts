import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import { createErrorResponse } from "@/features/shared/api/errors";
import { TripSummaryQuerySchema } from "@/features/shared/validation/schemas";
import { TripSummaryService } from "../../services/trip-summary.service";
import { WorkspaceSettingService } from "@/features/workspace/services/workspace-setting.service";
import { resolveDefaultCurrencyFromSetting } from "@/features/workspace/utils/resolve-default-currency";
import { json } from "@tanstack/react-start";

export async function GET({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(params.workspaceId, async ({ userId, workspaceId }) => {
      const url = new URL(request.url);
      const query = {
        from: url.searchParams.get("from") ?? undefined,
        to: url.searchParams.get("to") ?? undefined,
        tagIds: url.searchParams.getAll("tagIds"),
        ledgerAccountIds: url.searchParams.getAll("ledgerAccountIds"),
      };
      const validated = TripSummaryQuerySchema.parse({
        ...query,
        tagIds: query.tagIds.length > 0 ? query.tagIds : undefined,
        ledgerAccountIds:
          query.ledgerAccountIds.length > 0
            ? query.ledgerAccountIds
            : undefined,
      });
      const settings = await WorkspaceSettingService.getWorkspaceSetting(
        userId,
        workspaceId,
      );
      const summary = await TripSummaryService.getSummary(
        userId,
        workspaceId,
        validated,
        resolveDefaultCurrencyFromSetting(settings),
      );
      return json(summary);
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
