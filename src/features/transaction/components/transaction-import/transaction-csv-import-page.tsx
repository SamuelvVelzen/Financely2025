import { TransactionImportProvider } from "./steps/transaction-import-provider";
import { TransactionImportWizard } from "./transaction-import-wizard";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { workspaceIdToRouteParam } from "@/features/workspace/workspace-id";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

type ITransactionCsvImportPageProps = {
  /**
   * Embed inside another surface (e.g. onboarding wizard): hide page chrome,
   * skip route blocking, and call callbacks instead of navigating away.
   */
  embedded?: boolean;
  onEmbeddedSuccess?: () => void;
  onEmbeddedCancel?: () => void;
};

export function TransactionCsvImportPage({
  embedded = false,
  onEmbeddedSuccess,
  onEmbeddedCancel,
}: ITransactionCsvImportPageProps) {
  const navigate = useNavigate();
  const workspaceId = useActiveWorkspaceId();
  const workspaceRouteParam = workspaceIdToRouteParam(workspaceId);

  const goToTransactions = useCallback(() => {
    navigate({
      to: "/$workspaceId/transactions",
      params: { workspaceId: workspaceRouteParam },
      search: {},
      ignoreBlocker: true,
    });
  }, [navigate, workspaceRouteParam]);

  const handleLeave = useCallback(() => {
    if (embedded) {
      onEmbeddedCancel?.();
      return;
    }
    goToTransactions();
  }, [embedded, onEmbeddedCancel, goToTransactions]);

  const handleComplete = useCallback(() => {
    if (embedded) {
      onEmbeddedSuccess?.();
      return;
    }
    goToTransactions();
  }, [embedded, onEmbeddedSuccess, goToTransactions]);

  return (
    <TransactionImportProvider onClose={handleComplete}>
      <TransactionImportWizard
        embedded={embedded}
        onLeave={handleLeave}
      />
    </TransactionImportProvider>
  );
}
