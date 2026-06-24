import { OnlineStatusNotifier } from "@/features/shared/components/online-status-notifier";
import { OfflineMutationProcessor } from "@/features/shared/offline/offline-mutation-processor";
import { OfflineMutationQueuedToastListener } from "@/features/shared/offline/offline-mutation-queued-toast-listener";
import { OfflineOutboxUserBinder } from "@/features/shared/offline/offline-outbox-user-binder";
import { QueryProvider } from "@/features/shared/query/client";
import { ToastContainer, ToastProvider } from "@/features/ui/toast";
import {
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";

export function RootLayout() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'system';
                  let resolvedTheme = theme;
                  
                  if (theme === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    resolvedTheme = prefersDark ? 'dark' : 'light';
                  }
                  
                  if (resolvedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <QueryProvider>
          <ToastProvider>
            <OfflineOutboxUserBinder />
            <OfflineMutationProcessor />
            <OfflineMutationQueuedToastListener />
            <OnlineStatusNotifier />
            <Outlet />
            <ToastContainer />
          </ToastProvider>
        </QueryProvider>
        <Scripts />
      </body>
    </html>
  );
}
