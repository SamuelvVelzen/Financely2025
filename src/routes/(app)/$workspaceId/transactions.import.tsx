import { TransactionImportPage } from "@/features/transaction/pages/transaction-import-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/$workspaceId/transactions/import")({
  component: TransactionImportPage,
  head: () => ({
    meta: [
      {
        title: "Import transactions | Financely",
      },
    ],
  }),
});
