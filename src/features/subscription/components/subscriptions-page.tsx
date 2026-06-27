import { useScrollPosition } from "@/features/shared/hooks/use-scroll-position";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { queryKeys } from "@/features/shared/query/keys";
import type {
  ISubscription,
  ITransaction,
} from "@/features/shared/validation/schemas";
import { DismissedTabContent } from "@/features/subscription/components/dismissed-tab-content";
import { SubscriptionsTabContent } from "@/features/subscription/components/subscriptions-tab-content";
import {
  useDeleteSubscription,
  useSubscriptions,
  useUpdateSubscription,
} from "@/features/subscription/hooks/useSubscriptions";
import { getTransaction } from "@/features/transaction/api/client";
import { AddOrEditTransactionDialog } from "@/features/transaction/components/add-or-edit-transaction-dialog";
import { Container } from "@/features/ui/container/container";
import { QueryErrorState } from "@/features/ui/container/query-error-state";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { Loading } from "@/features/ui/loading";
import { Tab } from "@/features/ui/tab/tab";
import { TabContent } from "@/features/ui/tab/tab-content";
import { Tabs } from "@/features/ui/tab/tabs";
import { useToast } from "@/features/ui/toast";
import { useActiveWorkspaceId } from "@/features/workspace/active-workspace-context";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SubscriptionDetectionDialog } from "./subscription-detection-dialog";
import { SubscriptionOverviewHeader } from "./subscription-overview-header";

export function SubscriptionsPage() {
  const toast = useToast();
  const workspaceId = useActiveWorkspaceId();
  const queryClient = useQueryClient();
  const expandedHeaderRef = useRef<HTMLDivElement>(null);
  const [isSticky, setExpandedHeaderElement] = useScrollPosition();
  const {
    data: subscriptionsData,
    isLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useSubscriptions();
  const { mutate: updateSub } = useUpdateSubscription();
  const { mutate: deleteSub } = useDeleteSubscription();

  const [isDetectDialogOpen, setIsDetectDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ISubscription | null>(
    null,
  );
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    ITransaction | undefined
  >(undefined);
  const subscriptions = subscriptionsData?.data ?? [];

  useEffect(() => {
    if (expandedHeaderRef.current) {
      setExpandedHeaderElement(expandedHeaderRef.current);
    }
  }, [setExpandedHeaderElement]);

  const actions = useMemo(
    () => ({
      onDetectSubscriptions: () => setIsDetectDialogOpen(true),
    }),
    [],
  );

  const handleToggleActive = useCallback(
    (subscription: ISubscription) => {
      updateSub(
        {
          subscriptionId: subscription.id,
          input: { active: !subscription.active },
        },
        {
          onSuccess: (data) => {
            if (!isOfflineMutationPlaceholder(data)) {
              toast.success(
                subscription.active
                  ? "Subscription paused"
                  : "Subscription resumed",
              );
            }
          },
          onError: () => {
            toast.error("Failed to update subscription");
          },
        },
      );
    },
    [updateSub, toast],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteSub(deleteTarget.id, {
      onSuccess: (data) => {
        if (!isOfflineMutationPlaceholder(data)) {
          toast.success("Subscription deleted");
        }
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Failed to delete subscription");
      },
    });
  }, [deleteTarget, deleteSub, toast]);

  const handleTransactionClick = useCallback(
    async (transactionId: string) => {
      try {
        const transaction = await queryClient.fetchQuery({
          queryKey: queryKeys.transaction(workspaceId, transactionId),
          queryFn: () => getTransaction(workspaceId, transactionId),
        });
        setSelectedTransaction(transaction);
        setIsTransactionDialogOpen(true);
      } catch {
        toast.error("Failed to load transaction");
      }
    },
    [queryClient, workspaceId, toast],
  );

  const handleTransactionDialogSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["subscriptions", workspaceId],
    });
  }, [queryClient, workspaceId]);

  return (
    <>
      <div ref={expandedHeaderRef} className="h-0" />

      <SubscriptionOverviewHeader
        actions={actions}
        isSticky={isSticky}
      />

      <Container>
        {isLoading && <Loading text="Loading subscriptions" />}

        {subscriptionsError && !isLoading && (
          <QueryErrorState
            title="Unable to load subscriptions"
            message={subscriptionsError.message}
            onRetry={() => void refetchSubscriptions()}
          />
        )}

        {!isLoading && !subscriptionsError && (
          <Tabs defaultValue="subscriptions">
            <Tab value="subscriptions">Subscriptions</Tab>
            <Tab value="dismissed">Dismissed</Tab>

            <TabContent value="subscriptions">
              <SubscriptionsTabContent
                subscriptions={subscriptions}
                onToggleActive={handleToggleActive}
                onDelete={setDeleteTarget}
                onDetect={() => setIsDetectDialogOpen(true)}
                onTransactionClick={handleTransactionClick}
              />
            </TabContent>

            <TabContent value="dismissed">
              <DismissedTabContent />
            </TabContent>
          </Tabs>
        )}
      </Container>

      <SubscriptionDetectionDialog
        open={isDetectDialogOpen}
        onOpenChange={setIsDetectDialogOpen}
      />

      <AddOrEditTransactionDialog
        open={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        transaction={selectedTransaction}
        onSuccess={handleTransactionDialogSuccess}
      />

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Subscription"
        content={`Are you sure you want to delete "${deleteTarget?.name}"? Transactions will be unlinked but not deleted.`}
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: () => setDeleteTarget(null),
          },
          {
            buttonContent: "Delete",
            clicked: handleDeleteConfirm,
            variant: "danger",
          },
        ]}
      />
    </>
  );
}
