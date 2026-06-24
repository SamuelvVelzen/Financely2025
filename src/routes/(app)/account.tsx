import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/users/pages/account-page";

export const Route = createFileRoute("/(app)/account")({
  component: AccountPage,
  head: () => ({
    meta: [
      {
        title: "Account | Financely",
      },
    ],
  }),
});
