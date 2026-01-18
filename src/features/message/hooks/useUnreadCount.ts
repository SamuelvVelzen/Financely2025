import { getUnreadCount } from "@/features/message/api/client";
import { useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type { IUnreadCountResponse } from "@/features/shared/validation/schemas";

/**
 * Query unread message count
 * - staleTime: 15 minutes (data stays fresh for 15 minutes)
 * - refetchInterval: 15 minutes (auto-refresh every 15 minutes)
 */
export function useUnreadCount() {
  return useFinQuery<IUnreadCountResponse, Error>({
    queryKey: queryKeys.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 15 * 60 * 1000, // Auto-refresh every 15 minutes
  });
}
