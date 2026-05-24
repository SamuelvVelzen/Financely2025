import { getClientIp } from "./get-client-ip";
import { enforceRateLimit } from "./enforce-rate-limit";
import type { IRateLimitPolicy } from "./rate-limit";

type IWorkspaceApiHandler = (args: {
  request: Request;
  params: { workspaceId: string };
}) => Promise<Response>;

/**
 * Rate limit by IP + workspace id (runs before auth to limit abuse cost).
 */
export function withWorkspaceRateLimit(
  bucket: string,
  policy: IRateLimitPolicy,
  handler: IWorkspaceApiHandler,
): IWorkspaceApiHandler {
  return async (args) => {
    const key = `${bucket}:${getClientIp(args.request)}:${args.params.workspaceId}`;
    const blocked = enforceRateLimit(key, policy);
    if (blocked) {
      return blocked;
    }
    return handler(args);
  };
}
