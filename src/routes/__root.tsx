import { OnlineStatusNotifier } from "@/features/shared/components/online-status-notifier";
import { QueryProvider } from "@/features/shared/query/client";
import { ToastContainer, ToastProvider } from "@/features/ui/toast";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import appCss from "./globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "Financely" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootLayout,
});

function RootLayout() {
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
