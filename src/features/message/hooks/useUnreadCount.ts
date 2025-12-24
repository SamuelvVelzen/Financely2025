import { useFinQuery } from "@/features/shared/query/core";
import { queryKeys } from "@/features/shared/query/keys";
import type { IUnreadCountResponse } from "@/features/shared/validation/schemas";
import { getUnreadCount } from "@/features/message/api/client";

/**
 * Query unread message count
 * - staleTime: 10 seconds (very short, count changes frequently)
 * - refetchInterval: 30 seconds (auto-refresh every 30 seconds)
 */
export function useUnreadCount() {
  return useFinQuery<IUnreadCountResponse, Error>({
    queryKey: queryKeys.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

