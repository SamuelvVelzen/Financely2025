import { isOfflineMutationPlaceholder } from "@/features/shared/offline/offline-mutation-errors";
import type { ISubscriptionDismissal } from "@/features/shared/validation/schemas";
import {
  useSubscriptionDismissals,
  useUndismissCandidate,
} from "@/features/subscription/hooks/useSubscriptions";
import { Button } from "@/features/ui/button/button";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { QueryErrorState } from "@/features/ui/container/query-error-state";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { List } from "@/features/ui/list/list";
import { ListItem } from "@/features/ui/list/list-item";
import { Loading } from "@/features/ui/loading";
import { useToast } from "@/features/ui/toast";
import { matchesSearchQuery } from "@/features/util/matches-search-query";
import { useCallback, useMemo, useState } from "react";
import { HiArrowUturnLeft, HiNoSymbol } from "react-icons/hi2";

export function DismissedTabContent({
  searchQuery = "",
}: {
  searchQuery?: string;
}) {
  const toast = useToast();
  const {
    data: dismissalsData,
    isLoading,
    error,
    refetch,
  } = useSubscriptionDismissals();
  const { mutate: undismiss, isPending: isUndismissing } =
    useUndismissCandidate();
  const [undismissingId, setUndismissingId] = useState<string | null>(null);
  const [restoreConfirmDismissal, setRestoreConfirmDismissal] =
    useState<ISubscriptionDismissal | null>(null);

  const dismissals = useMemo(
    () => dismissalsData?.data ?? [],
    [dismissalsData?.data],
  );
  const filteredDismissals = useMemo(
    () =>
      dismissals.filter((dismissal) =>
        matchesSearchQuery(searchQuery, dismissal.normalizedName),
      ),
    [dismissals, searchQuery],
  );

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

  if (error) {
    return (
      <QueryErrorState
        title="Unable to load dismissed subscriptions"
        message={error.message}
        onRetry={() => void refetch()}
      />
    );
  }

  if (dismissals.length === 0) {
    return (
      <EmptyPage
        icon={HiNoSymbol}
        emptyText="No dismissed subscriptions. When you mark a detected subscription as 'Not a subscription', it will appear here."
      />
    );
  }

  if (filteredDismissals.length === 0) {
    return (
      <EmptyPage
        icon={HiNoSymbol}
        emptyText="No dismissed subscriptions match your search."
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
        data={filteredDismissals}
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
