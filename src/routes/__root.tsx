import { createRootRoute } from "@tanstack/react-router";
import appCss from "./globals.css?url";
import { RootLayout } from "@/features/shared/pages/root-layout";

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
