import { LedgerAccountsPage } from "@/features/ledger-account/pages/ledger-accounts-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/$workspaceId/accounts/")({
  component: LedgerAccountsPage,
  head: () => ({
    meta: [{ title: "Accounts | Financely" }],
  }),
});
