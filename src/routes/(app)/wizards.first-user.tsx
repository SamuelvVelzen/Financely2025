import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path from brief first-user rename — redirect to onboarding. */
export const Route = createFileRoute("/(app)/wizards/first-user")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/onboarding",
      search: {
        step:
          typeof search === "object" && search && "step" in search
            ? (search.step as string | undefined)
            : undefined,
      },
    });
  },
});
