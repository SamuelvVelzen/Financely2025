import type { ISubscription } from "@/features/shared/validation/schemas";
import { SubscriptionListItem } from "@/features/subscription/components/subscription-list-item";
import { EmptyPage } from "@/features/ui/container/empty-container";
import { List } from "@/features/ui/list/list";
import { HiArrowPath } from "react-icons/hi2";

export type ISubscriptionsTabContentProps = {
  subscriptions: ISubscription[];
  onToggleActive: (subscription: ISubscription) => void;
  onDelete: (subscription: ISubscription) => void;
  onDetect: () => void;
  onTransactionClick: (transactionId: string) => void;
};

export function SubscriptionsTabContent({
  subscriptions,
  onToggleActive,
  onDelete,
  onDetect,
  onTransactionClick,
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
          onTransactionClick={onTransactionClick}
        />
      )}
    </List>
  );
}
