import { setOfflineOutboxUserId } from "@/features/shared/offline/offline-mutation-outbox";
import { authClient } from "@/lib/auth-client";
import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * Keeps offline outbox user scope aligned with Better Auth session (UserInfo id).
 * Uses session polling on navigation so login/logout updates without calling /me.
 */
export function OfflineOutboxUserBinder() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  useEffect(() => {
    let cancelled = false;
    void authClient.getSession().then((res) => {
      if (cancelled) return;
      setOfflineOutboxUserId(res.data?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
