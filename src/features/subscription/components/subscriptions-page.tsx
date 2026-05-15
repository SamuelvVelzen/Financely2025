import type {
  ISubscription,
  ISubscriptionDismissal,
} from "@/features/shared/validation/schemas";
import {
  useDeleteSubscription,
  useSubscriptionDismissals,
  useSubscriptions,
  useUndismissCandidate,
  useUpdateSubscription,
} from "@/features/subscription/hooks/useSubscriptions";
import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import { Badge } from "@/features/ui/badge/badge";
import { Button } from "@/features/ui/button/button";
import { Container } from "@/features/ui/container/container";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { DeleteDialog } from "@/features/ui/dialog/delete-dialog";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Loading } from "@/features/ui/loading";
import { Tab } from "@/features/ui/tab/tab";
import { TabContent } from "@/features/ui/tab/tab-content";
import { Tabs } from "@/features/ui/tab/tabs";
import { useToast } from "@/features/ui/toast";
import { Title } from "@/features/ui/typography/title";
import { useCallback, useState } from "react";
import {
  HiArrowPath,
  HiArrowUturnLeft,
  HiMagnifyingGlass,
  HiNoSymbol,
} from "react-icons/hi2";
import { SubscriptionDetectionDialog } from "./subscription-detection-dialog";
import { SubscriptionListItem } from "./subscription-list-item";

export function SubscriptionsPage() {
  const toast = useToast();
  const { data: subscriptionsData, isLoading } = useSubscriptions();
  const { mutate: updateSub } = useUpdateSubscription();
  const { mutate: deleteSub } = useDeleteSubscription();

  const [isDetectDialogOpen, setIsDetectDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ISubscription | null>(
    null,
  );

  const subscriptions = subscriptionsData?.data ?? [];

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

  if (isLoading) {
    return (
      <Container>
        <Loading text="Loading subscriptions" />
      </Container>
    );
  }

  return (
    <>
      <Container className="sticky top-0 z-10 bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Title>Subscriptions</Title>
            {subscriptions.length > 0 && (
              <Badge>{subscriptions.length}</Badge>
            )}
          </div>
          <Button
            variant="primary"
            clicked={() => setIsDetectDialogOpen(true)}>
            <HiMagnifyingGlass className="size-4 mr-2" />
            Detect Subscriptions
          </Button>
        </div>
      </Container>

      <Container>
        <Tabs defaultValue="subscriptions">
          <Tab value="subscriptions">Subscriptions</Tab>
          <Tab value="dismissed">Dismissed</Tab>

          <TabContent value="subscriptions">
            <SubscriptionsTabContent
              subscriptions={subscriptions}
              onToggleActive={handleToggleActive}
              onDelete={setDeleteTarget}
              onDetect={() => setIsDetectDialogOpen(true)}
            />
          </TabContent>

          <TabContent value="dismissed">
            <DismissedTabContent />
          </TabContent>
        </Tabs>
      </Container>

      <SubscriptionDetectionDialog
        open={isDetectDialogOpen}
        onOpenChange={setIsDetectDialogOpen}
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

type ISubscriptionsTabContentProps = {
  subscriptions: ISubscription[];
  onToggleActive: (subscription: ISubscription) => void;
  onDelete: (subscription: ISubscription) => void;
  onDetect: () => void;
};

function SubscriptionsTabContent({
  subscriptions,
  onToggleActive,
  onDelete,
  onDetect,
}: ISubscriptionsTabContentProps) {
  if (subscriptions.length === 0) {
    return (
      <EmptyPage
        icon={HiArrowPath}
        emptyText="No subscriptions yet. Click 'Detect Subscriptions' to find recurring transactions."
        button={{
          buttonContent: "Detect Subscriptions",
          clicked: onDetect,
        }}
      />
    );
  }

  return (
    <List
      data={subscriptions}
      getItemKey={(s) => s.id}>
      {(subscription) => (
        <SubscriptionListItem
          key={subscription.id}
          subscription={subscription}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      )}
    </List>
  );
}

function DismissedTabContent() {
  const toast = useToast();
  const { data: dismissalsData, isLoading } = useSubscriptionDismissals();
  const { mutate: undismiss, isPending: isUndismissing } =
    useUndismissCandidate();
  const [undismissingId, setUndismissingId] = useState<string | null>(null);
  const [restoreConfirmDismissal, setRestoreConfirmDismissal] =
    useState<ISubscriptionDismissal | null>(null);

  const dismissals = dismissalsData?.data ?? [];

  const handleRestoreClick = useCallback(
    (dismissal: ISubscriptionDismissal) => {
      setRestoreConfirmDismissal(dismissal);
    },
    [],
  );

  const handleRestoreConfirm = useCallback(() => {
    if (!restoreConfirmDismissal) return;
    const dismissal = restoreConfirmDismissal;
    setRestoreConfirmDismissal(null);
    setUndismissingId(dismissal.id);
    undismiss(dismissal.id, {
      onSuccess: (data) => {
        if (!isOfflineMutationPlaceholder(data)) {
          toast.success(
            `"${dismissal.normalizedName}" can be detected again`,
          );
        }
        setUndismissingId(null);
      },
      onError: () => {
        toast.error("Failed to restore candidate");
        setUndismissingId(null);
      },
    });
  }, [restoreConfirmDismissal, undismiss, toast]);

  const handleRestoreCancel = useCallback(() => {
    setRestoreConfirmDismissal(null);
  }, []);

  if (isLoading) {
    return <Loading text="Loading dismissed subscriptions" />;
  }

  if (dismissals.length === 0) {
    return (
      <EmptyPage
        icon={HiNoSymbol}
        emptyText="No dismissed subscriptions. When you mark a detected subscription as 'Not a subscription', it will appear here."
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-text-muted mb-4">
        These subscription candidates were dismissed. You can restore them so
        they appear in detection results again.
      </p>
      <List
        data={dismissals}
        getItemKey={(d) => d.id}>
        {(dismissal) => (
          <ListItem
            key={dismissal.id}
            className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <HiNoSymbol className="size-4 text-text-muted shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-text truncate block">
                  {dismissal.normalizedName}
                </span>
                <span className="text-xs text-text-muted">
                  {dismissal.type === "EXPENSE" ? "Expense" : "Income"}
                </span>
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              clicked={() => handleRestoreClick(dismissal)}
              loading={undismissingId === dismissal.id}
              disabled={isUndismissing && undismissingId !== dismissal.id}>
              <HiArrowUturnLeft className="size-3.5 mr-1.5" />
              Restore
            </Button>
          </ListItem>
        )}
      </List>

      <Dialog
        open={restoreConfirmDismissal !== null}
        onOpenChange={(open) => {
          if (!open) handleRestoreCancel();
        }}
        dismissible={!isUndismissing}
        variant="modal"
        size="sm"
        title="Restore subscription?"
        content={
          restoreConfirmDismissal ? (
            <p className="text-sm text-text-muted">
              Are you sure you want to restore &quot;
              {restoreConfirmDismissal.normalizedName}&quot;? It will appear in
              detection results again so you can confirm it as a subscription.
            </p>
          ) : null
        }
        footerButtons={[
          {
            buttonContent: "Cancel",
            clicked: handleRestoreCancel,
            disabled: isUndismissing,
          },
          {
            buttonContent: "Restore",
            variant: "primary",
            clicked: handleRestoreConfirm,
            loading: {
              isLoading:
                isUndismissing &&
                restoreConfirmDismissal !== null &&
                undismissingId === restoreConfirmDismissal.id,
              text: "Restoring",
            },
            disabled: isUndismissing,
          },
        ]}
      />
    </div>
  );
}
