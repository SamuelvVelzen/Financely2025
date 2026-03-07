import type { ISubscriptionCandidate } from "@/features/shared/validation/schemas";
import { detectSubscriptions } from "@/features/subscription/api/client";
import {
  useConfirmSubscription,
  useDismissCandidate,
} from "@/features/subscription/hooks/useSubscriptions";
import { Dialog } from "@/features/ui/dialog/dialog/dialog";
import { Loading } from "@/features/ui/loading";
import { useToast } from "@/features/ui/toast";
import { useCallback, useEffect, useState } from "react";
import { HiArrowPath } from "react-icons/hi2";
import { SubscriptionCandidateCard } from "./subscription-candidate-card";

type ISubscriptionDetectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SubscriptionDetectionDialog({
  open,
  onOpenChange,
}: ISubscriptionDetectionDialogProps) {
  const toast = useToast();
  const { mutate: confirmSub } = useConfirmSubscription();
  const { mutate: dismissCandidate } = useDismissCandidate();

  const [candidates, setCandidates] = useState<ISubscriptionCandidate[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasDetected, setHasDetected] = useState(false);
  const [confirmingName, setConfirmingName] = useState<string | null>(null);
  const [dismissingName, setDismissingName] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setCandidates([]);
    setHasDetected(false);
    setConfirmingName(null);
    setDismissingName(null);

    setIsDetecting(true);
    detectSubscriptions()
      .then((result) => {
        setCandidates(result.candidates);
        setHasDetected(true);
      })
      .catch(() => {
        toast.error("Failed to detect subscriptions");
      })
      .finally(() => {
        setIsDetecting(false);
      });
  }, [open]);

  const handleConfirm = useCallback(
    (candidate: ISubscriptionCandidate) => {
      setConfirmingName(candidate.normalizedName);
      confirmSub(
        {
          name: candidate.displayName,
          type: candidate.type,
          amount: candidate.averageAmount,
          currency: candidate.currency,
          frequency: candidate.frequency,
          transactionIds: candidate.transactionIds,
        },
        {
          onSuccess: () => {
            setCandidates((prev) => {
              const next = prev.filter(
                (c) => c.normalizedName !== candidate.normalizedName,
              );
              if (next.length === 0) {
                onOpenChange(false);
                toast.success("All subscriptions confirmed");
              } else {
                toast.success(
                  `"${candidate.displayName}" confirmed as subscription`,
                );
              }
              return next;
            });
            setConfirmingName(null);
          },
          onError: () => {
            toast.error("Failed to confirm subscription");
            setConfirmingName(null);
          },
        },
      );
    },
    [confirmSub, toast, onOpenChange],
  );

  const handleDismiss = useCallback(
    (candidate: ISubscriptionCandidate) => {
      setDismissingName(candidate.normalizedName);
      dismissCandidate(
        {
          normalizedName: candidate.normalizedName,
          type: candidate.type,
        },
        {
          onSuccess: () => {
            setCandidates((prev) => {
              const next = prev.filter(
                (c) => c.normalizedName !== candidate.normalizedName,
              );
              if (next.length === 0) {
                onOpenChange(false);
              }
              return next;
            });
            toast.success("Candidate dismissed");
            setDismissingName(null);
          },
          onError: () => {
            toast.error("Failed to dismiss candidate");
            setDismissingName(null);
          },
        },
      );
    },
    [dismissCandidate, toast, onOpenChange],
  );

  const dialogContent = isDetecting ? (
    <Loading text="Scanning transactions for recurring patterns..." />
  ) : hasDetected && candidates.length === 0 ? (
    <div className="flex flex-col items-center gap-4 py-8 text-text-muted">
      <div className="text-5xl border-4 p-2 rounded-full">
        <HiArrowPath className="size-8" />
      </div>
      <p className="text-center">
        No new subscriptions detected. Add more transactions and try again.
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm text-text-muted">
          {candidates.length} potential subscription
          {candidates.length > 1 ? "s" : ""} found. Confirm or dismiss each
          one.
        </p>
      </div>
      {candidates.map((candidate) => (
        <SubscriptionCandidateCard
          key={`${candidate.normalizedName}-${candidate.type}`}
          candidate={candidate}
          onConfirm={handleConfirm}
          onDismiss={handleDismiss}
          isConfirming={confirmingName === candidate.normalizedName}
          isDismissing={dismissingName === candidate.normalizedName}
        />
      ))}
    </div>
  );

  return (
    <Dialog
      title="Detect Subscriptions"
      content={dialogContent}
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!confirmingName && !dismissingName}
      variant="modal"
      size="1/2"
      footerButtons={
        hasDetected && candidates.length === 0
          ? [
            {
              buttonContent: "Close",
              clicked: () => onOpenChange(false),
            },
          ]
          : undefined
      }
    />
  );
}
